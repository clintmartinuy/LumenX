import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactSource, InquirySource } from "@/lib/validation/enums";

type FindOrCreateCustomerInput = {
  fullName?: string;
  phone?: string;
  email?: string;
  customerType?: "b2c" | "b2b";
  businessName?: string;
  facebookPsid?: string;
  source: ContactSource;
};

// Shared by the contact form (website_form), chat widget (website_chat), and the
// Messenger webhook (messenger) — each channel resolves a customer differently
// (phone vs Facebook PSID) but converges here.
export async function findOrCreateCustomer(input: FindOrCreateCustomerInput): Promise<string> {
  const supabase = createAdminClient();

  if (input.facebookPsid) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("facebook_psid", input.facebookPsid)
      .maybeSingle();
    if (data) return data.id as string;
  } else if (input.phone) {
    const { data } = await supabase.from("customers").select("id").eq("phone", input.phone).maybeSingle();
    if (data) return data.id as string;
  }

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      full_name: input.fullName ?? "Unknown",
      phone: input.phone ?? null,
      email: input.email ?? null,
      customer_type: input.customerType ?? "b2c",
      business_name: input.businessName ?? null,
      facebook_psid: input.facebookPsid ?? null,
      first_contact_source: input.source,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}

type CreateInquiryInput = {
  customerId: string | null;
  source: InquirySource;
  channelThreadId?: string;
  subject?: string;
  message: string;
  productInterest?: string[];
  status?: "new" | "spam";
};

export async function createInquiry(
  input: CreateInquiryInput,
): Promise<{ id: string; reference: string }> {
  const supabase = createAdminClient();

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      customer_id: input.customerId,
      source: input.source,
      channel_thread_id: input.channelThreadId ?? null,
      subject: input.subject ?? null,
      message: input.message,
      status: input.status ?? "new",
      product_interest: input.productInterest ?? null,
    })
    .select("id, reference")
    .single();

  if (error) throw error;

  if (input.status !== "spam") {
    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiry.id,
      direction: "inbound",
      sender_type: "customer",
      body: input.message,
    });
  }

  return inquiry as { id: string; reference: string };
}
