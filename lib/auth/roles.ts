import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "admin" | "staff" | "viewer";

export type StaffProfile = {
  fullName: string;
  role: StaffRole;
};

const ROLE_RANK: Record<StaffRole, number> = {
  viewer: 0,
  staff: 1,
  admin: 2,
  owner: 3,
};

export function hasMinimumRole(role: StaffRole, minimum: StaffRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// Single lookup used by the admin guard and by Server Actions/Components that need to
// check role before a mutation. `user` non-null + `profile` null means "authenticated but
// not staff (or deactivated)" — the admin layout renders an access-pending screen for that.
export async function getCurrentStaffProfile(): Promise<{
  user: User | null;
  profile: StaffProfile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data } = await supabase
    .from("staff_profiles")
    .select("full_name, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) {
    return { user, profile: null };
  }

  return {
    user,
    profile: { fullName: data.full_name as string, role: data.role as StaffRole },
  };
}
