import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateCustomer, createInquiry } from "@/lib/inquiries/service";
import { getAutoReply } from "@/lib/autoreply/responder";
import { checkRateLimit } from "@/lib/rate-limit";

const chatMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`chat:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const parsed = chatMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { sessionId, message, fullName, phone } = parsed.data;

  const supabase = createAdminClient();

  const { data: existingInquiry } = await supabase
    .from("inquiries")
    .select("id, status")
    .eq("channel_thread_id", sessionId)
    .eq("source", "website_chat")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let inquiryId: string;

  if (existingInquiry) {
    inquiryId = existingInquiry.id as string;
    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "inbound",
      sender_type: "customer",
      body: message,
    });
  } else {
    let customerId: string | null = null;
    if (phone) {
      customerId = await findOrCreateCustomer({ fullName, phone, source: "website_chat" });
    }

    const inquiry = await createInquiry({
      customerId,
      source: "website_chat",
      channelThreadId: sessionId,
      message,
    });
    inquiryId = inquiry.id;
  }

  const reply = await getAutoReply(inquiryId, message, "website_chat");

  if (reply.sent && reply.body) {
    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "outbound",
      sender_type: "bot",
      body: reply.body,
    });
  }

  return NextResponse.json({
    inquiryId,
    reply: reply.sent ? reply.body : null,
    needsHuman: reply.needsHuman,
  });
}
