"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile } from "@/lib/auth/roles";

type Result = { error: string } | { success: true };

// §8.3: once a staff member replies in a thread, the bot is disabled for that thread for
// 24 hours — recorded as inquiries.meta.bot_paused_until, read back by
// lib/autoreply/responder.ts on the next inbound message.
export async function sendStaffReply(inquiryId: string, body: string): Promise<Result> {
  const { user, profile } = await getCurrentStaffProfile();
  if (!profile || !user) return { error: "You don't have permission to do that." };

  const supabase = await createClient();

  const { data: inquiry } = await supabase.from("inquiries").select("meta").eq("id", inquiryId).maybeSingle();
  const meta = (inquiry?.meta as Record<string, unknown>) ?? {};
  const pausedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: messageError } = await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    direction: "outbound",
    sender_type: "staff",
    body,
  });
  if (messageError) return { error: messageError.message };

  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      status: "in_progress",
      first_response_at: new Date().toISOString(),
      meta: { ...meta, bot_paused_until: pausedUntil },
    })
    .eq("id", inquiryId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { success: true };
}

export async function updateInquiryStatus(inquiryId: string, status: string): Promise<Result> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "closed") updates.closed_at = new Date().toISOString();

  const { error } = await supabase.from("inquiries").update(updates).eq("id", inquiryId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/inquiries");
  return { success: true };
}

export async function assignInquiry(inquiryId: string, userId: string | null): Promise<Result> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update({ assigned_to: userId }).eq("id", inquiryId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { success: true };
}
