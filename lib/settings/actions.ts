"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile, hasMinimumRole } from "@/lib/auth/roles";

export async function updateSettings(input: {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  autoreplyEnabled: boolean;
  autoreplyAfterHoursOnly: boolean;
}): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile || !hasMinimumRole(profile.role, "admin")) {
    return { error: "You don't have permission to do that." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      business_name: input.businessName,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      autoreply_enabled: input.autoreplyEnabled,
      autoreply_after_hours_only: input.autoreplyAfterHoursOnly,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}
