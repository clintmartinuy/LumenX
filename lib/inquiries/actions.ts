"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInquiry, findOrCreateCustomer } from "@/lib/inquiries/service";

export async function submitContactForm(
  input: InquiryInput,
): Promise<{ error: string } | { success: true; reference: string }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(`inquiry:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many submissions from this connection. Please try again in a bit." };
  }

  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const isSpam = Boolean(parsed.data.companyWebsite);

  const customerId = await findOrCreateCustomer({
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email || undefined,
    customerType: parsed.data.customerType,
    source: "website_form",
  });

  let productInterest: string[] | undefined;
  if (parsed.data.productSku) {
    const supabase = createAdminClient();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("sku", parsed.data.productSku)
      .maybeSingle();
    if (product) productInterest = [product.id as string];
  }

  const inquiry = await createInquiry({
    customerId,
    source: "website_form",
    subject: parsed.data.subject,
    message: parsed.data.message,
    productInterest,
    status: isSpam ? "spam" : "new",
  });

  // TODO(Phase 6): run the message through the auto-reply matcher once
  // lib/autoreply/matcher.ts exists, and update status/first_response_at accordingly.

  return { success: true, reference: inquiry.reference };
}
