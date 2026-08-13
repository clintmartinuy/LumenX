import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateCustomer, createInquiry } from "@/lib/inquiries/service";
import { getAutoReply } from "@/lib/autoreply/responder";
import { fetchProfile, sendMessage } from "@/lib/messenger/send";

export type MessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; is_echo?: boolean };
};

// §7.2 processing pipeline, one event at a time. Runs after the webhook has already
// responded 200 (see app/api/messenger/webhook/route.ts's use of next/server's after()).
export async function processMessagingEvent(event: MessagingEvent): Promise<void> {
  const mid = event.message?.mid;
  if (!mid) return;

  const supabase = createAdminClient();

  // Dedup — Meta retries on slow responses, so the same mid can arrive more than once.
  const { error: dedupeError } = await supabase.from("messenger_processed_events").insert({ mid });
  if (dedupeError) return; // Primary key conflict = already processed; anything else, skip too.

  if (event.message?.is_echo) return; // Our own outbound message, already logged when sent.

  const text = event.message?.text;
  if (!text) return;

  const psid = event.sender.id;

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, full_name")
    .eq("facebook_psid", psid)
    .maybeSingle();

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id as string;
  } else {
    const profile = await fetchProfile(psid);
    const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : undefined;
    customerId = await findOrCreateCustomer({ fullName, facebookPsid: psid, source: "messenger" });
  }

  const { data: openInquiry } = await supabase
    .from("inquiries")
    .select("id")
    .eq("channel_thread_id", psid)
    .eq("source", "messenger")
    .not("status", "in", "(closed,converted,spam)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let inquiryId: string;
  if (openInquiry) {
    inquiryId = openInquiry.id as string;
    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "inbound",
      sender_type: "customer",
      body: text,
      meta: { mid },
    });
  } else {
    const inquiry = await createInquiry({
      customerId,
      source: "messenger",
      channelThreadId: psid,
      message: text,
    });
    inquiryId = inquiry.id;
  }

  const reply = await getAutoReply(inquiryId, text, "messenger");

  if (reply.sent && reply.body) {
    const result = await sendMessage(psid, { type: "text", text: reply.body });

    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "outbound",
      sender_type: "bot",
      body: reply.body,
      meta: result.success ? {} : { deliveryError: result.error },
    });
  }
}
