import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getInquiries(filters: { status?: string; source?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("inquiries")
    .select("id, reference, source, status, subject, message, intent, created_at, customers(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getInquiryThread(id: string) {
  const supabase = await createClient();
  const [{ data: inquiry, error }, { data: messages }] = await Promise.all([
    supabase.from("inquiries").select("*, customers(full_name, phone, email, customer_type)").eq("id", id).maybeSingle(),
    supabase.from("inquiry_messages").select("*").eq("inquiry_id", id).order("sent_at"),
  ]);
  if (error) throw error;
  if (!inquiry) return null;
  return { ...inquiry, messages: messages ?? [] };
}

export async function getCannedResponses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("autoreply_intents")
    .select("key, name, response_template")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
