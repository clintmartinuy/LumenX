// Mirrors the Postgres enums in supabase/migrations/00002_enums.sql. Kept as plain TS
// unions (not generated) since lib/supabase/types.ts is still a placeholder — regenerate
// this alongside the real Database type once a Supabase project exists.

export const CONTACT_SOURCES = [
  "messenger",
  "website_form",
  "website_chat",
  "walk_in",
  "referral",
  "phone",
] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const INQUIRY_SOURCES = ["messenger", "website_form", "website_chat", "phone", "walk_in"] as const;
export type InquirySource = (typeof INQUIRY_SOURCES)[number];

export const INQUIRY_STATUSES = [
  "new",
  "auto_answered",
  "needs_human",
  "in_progress",
  "quoted",
  "converted",
  "closed",
  "spam",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STAFF_ROLES = ["owner", "admin", "staff", "viewer"] as const;
export type StaffRoleValue = (typeof STAFF_ROLES)[number];
