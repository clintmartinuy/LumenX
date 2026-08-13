import "server-only";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
const STANDARD_WINDOW_MS = 24 * 60 * 60 * 1000;
const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function pageAccessToken(): string {
  const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("MESSENGER_PAGE_ACCESS_TOKEN is not configured");
  return token;
}

export type SendMessagePayload =
  | { type: "text"; text: string }
  | { type: "quick_replies"; text: string; options: { title: string; payload: string }[] }
  | {
      type: "generic";
      elements: { title: string; subtitle?: string; imageUrl?: string; url: string; buttonTitle: string }[];
    };

// §7.3: within the 24h standard window, any message is allowed; outside it, only a
// HUMAN_AGENT-tagged message is permitted, and that tag extends the window to 7 days.
export function canSendWithinWindow(lastInboundAt: Date | null, useHumanAgentTag: boolean): boolean {
  if (!lastInboundAt) return false;
  const elapsed = Date.now() - lastInboundAt.getTime();
  return useHumanAgentTag ? elapsed < HUMAN_AGENT_WINDOW_MS : elapsed < STANDARD_WINDOW_MS;
}

function toGraphMessage(payload: SendMessagePayload): Record<string, unknown> {
  switch (payload.type) {
    case "text":
      return { text: payload.text };
    case "quick_replies":
      return {
        text: payload.text,
        quick_replies: payload.options.map((o) => ({ content_type: "text", title: o.title, payload: o.payload })),
      };
    case "generic":
      return {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: payload.elements.map((el) => ({
              title: el.title,
              subtitle: el.subtitle,
              image_url: el.imageUrl,
              buttons: [{ type: "web_url", url: el.url, title: el.buttonTitle }],
            })),
          },
        },
      };
  }
}

async function graphPost(path: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${GRAPH_API_BASE}/${path}?access_token=${encodeURIComponent(pageAccessToken())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function withRetry(fn: () => Promise<Response>, maxAttempts = 3): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn();
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Messenger API ${res.status}`);
      } else {
        return res; // Non-retryable client error — caller inspects the response.
      }
    } catch (err) {
      lastError = err;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Messenger API request failed");
}

export async function sendTypingOn(psid: string): Promise<void> {
  await graphPost("me/messages", { recipient: { id: psid }, sender_action: "typing_on" }).catch(() => {});
}

export async function sendMessage(
  psid: string,
  payload: SendMessagePayload,
  options: { humanAgentTag?: boolean } = {},
): Promise<{ success: true } | { success: false; error: string }> {
  await sendTypingOn(psid);
  // A short delay after typing_on so replies don't feel instant/robotic (§7.3).
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const body: Record<string, unknown> = {
    recipient: { id: psid },
    message: toGraphMessage(payload),
    messaging_type: options.humanAgentTag ? "MESSAGE_TAG" : "RESPONSE",
  };
  if (options.humanAgentTag) body.tag = "HUMAN_AGENT";

  try {
    const res = await withRetry(() => graphPost("me/messages", body));
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Messenger API ${res.status}: ${text}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function fetchProfile(psid: string): Promise<{ firstName?: string; lastName?: string } | null> {
  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/${psid}?fields=first_name,last_name&access_token=${encodeURIComponent(pageAccessToken())}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { firstName: data.first_name, lastName: data.last_name };
  } catch {
    // Fail soft — a failed profile fetch must not break message handling (§7.2).
    return null;
  }
}
