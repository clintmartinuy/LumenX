import "server-only";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

// §7.4 — one-time setup via the Messenger Profile API. Call once after the Page Access
// Token exists (from Settings, see lib/messenger/actions.ts). Everything else about Meta
// App/Page setup is manual (§7.1) and documented in the README.
export async function configureMessengerProfile(siteUrl: string): Promise<{ success: true } | { success: false; error: string }> {
  const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  if (!token) return { success: false, error: "MESSENGER_PAGE_ACCESS_TOKEN is not configured" };

  const body = {
    greeting: [{ locale: "default", text: "Hi! Welcome to LumenX PH — high-wattage automotive lighting, sold and installed." }],
    get_started: { payload: "GET_STARTED" },
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [
          { type: "web_url", title: "View Products", url: `${siteUrl}/products` },
          { type: "web_url", title: "Book Installation", url: `${siteUrl}/book` },
          { type: "postback", title: "Talk to a Human", payload: "TALK_TO_HUMAN" },
        ],
      },
    ],
  };

  const res = await fetch(`${GRAPH_API_BASE}/me/messenger_profile?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { success: false, error: `Graph API ${res.status}: ${await res.text()}` };
  return { success: true };
}
