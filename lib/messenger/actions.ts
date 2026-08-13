"use server";

import { getCurrentStaffProfile, hasMinimumRole } from "@/lib/auth/roles";
import { configureMessengerProfile } from "@/lib/messenger/profile";
import { sendMessage } from "@/lib/messenger/send";

export async function setupMessengerProfileAction(): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile || !hasMinimumRole(profile.role, "admin")) return { error: "You don't have permission to do that." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const result = await configureMessengerProfile(siteUrl);
  return result.success ? { success: true } : { error: result.error };
}

export async function sendTestMessageAction(psid: string): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile || !hasMinimumRole(profile.role, "admin")) return { error: "You don't have permission to do that." };
  if (!psid.trim()) return { error: "Enter a recipient PSID (your own, if you're a Page admin/tester)." };

  const result = await sendMessage(psid.trim(), {
    type: "text",
    text: "This is a test message from LumenX PH's admin console.",
  });
  return result.success ? { success: true } : { error: result.error };
}
