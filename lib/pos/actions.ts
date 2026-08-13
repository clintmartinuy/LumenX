"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile, hasMinimumRole } from "@/lib/auth/roles";
import { searchCustomers as searchCustomersQuery } from "@/lib/queries/pos";
import { completeSaleSchema, type CompleteSaleInput } from "@/lib/validation/pos";

type ActionResult = { error: string } | { success: true; saleId: string; saleNumber: string };

// Thin Server Action wrapper — lib/queries/pos.ts is server-only and can't be imported
// directly from the client POS terminal component.
export async function searchCustomersAction(query: string) {
  return searchCustomersQuery(query);
}

export async function completeSale(input: CompleteSaleInput): Promise<ActionResult> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const parsed = completeSaleSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the cart and try again." };
  const data = parsed.data;

  if (data.pricingTier === "wholesale" && !hasMinimumRole(profile.role, "admin")) {
    return { error: "Wholesale pricing requires an admin or owner." };
  }
  if (data.overrideOversell && !hasMinimumRole(profile.role, "admin")) {
    return { error: "Only an admin or owner can override an oversell block." };
  }

  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("create_sale", {
    p_customer_id: data.customerId,
    p_pricing_tier: data.pricingTier,
    p_items: data.items.map((item) => ({
      item_type: item.itemType,
      product_id: item.productId ?? null,
      service_id: item.serviceId ?? null,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_discount: item.lineDiscount,
    })),
    p_discount_amount: data.discountAmount,
    p_discount_reason: data.discountReason ?? null,
    p_tax_amount: data.taxAmount,
    p_payment_method: data.paymentMethod,
    p_payment_reference: data.paymentReference ?? null,
    p_amount_paid: data.amountPaid,
    p_booking_id: data.bookingId ?? null,
    p_notes: data.notes ?? null,
    p_override_oversell: data.overrideOversell,
    p_override_reason: data.overrideReason ?? null,
  });

  if (error) return { error: error.message };
  const row = Array.isArray(result) ? result[0] : result;
  if (!row) return { error: "Sale could not be completed." };

  revalidatePath("/admin/pos");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/inventory");

  return { success: true, saleId: row.sale_id as string, saleNumber: row.sale_number as string };
}
