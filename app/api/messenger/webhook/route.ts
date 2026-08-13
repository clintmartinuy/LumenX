import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { verifySignature } from "@/lib/messenger/verify";
import { processMessagingEvent, type MessagingEvent } from "@/lib/messenger/receive";

// §7.2 GET — verification handshake, run once when the webhook URL is configured in the
// Meta App dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// §7.2 POST — event receiver. Must verify the raw-body signature, respond 200
// immediately (Meta retries on slow responses and will duplicate events), and process
// asynchronously — after() guarantees the callback runs to completion even though the
// response has already been sent, which a bare fire-and-forget async call would not on a
// serverless platform that freezes the function once the response goes out.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !verifySignature(rawBody, signature, appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: { object?: string; entry?: { messaging?: MessagingEvent[] }[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (payload.object === "page") {
    const events = (payload.entry ?? []).flatMap((entry) => entry.messaging ?? []);
    after(async () => {
      for (const event of events) {
        try {
          await processMessagingEvent(event);
        } catch (err) {
          console.error("messenger webhook: failed to process event", err);
        }
      }
    });
  }

  return NextResponse.json({ status: "ok" });
}
