import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentStaffProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Access pending</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          You&apos;re signed in, but there&apos;s no active staff profile for your account
          yet. Ask an owner or admin to add you under Settings &rarr; Staff.
        </p>
        <SignOutButton />
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/admin" className="font-semibold">
          LumenX PH Admin
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-xs capitalize">
            {profile.fullName} · {profile.role}
          </p>
          <SignOutButton />
        </div>
      </header>
      <AdminNav role={profile.role} />
      <main className="p-6">{children}</main>
    </div>
  );
}
