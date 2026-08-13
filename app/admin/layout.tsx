import { redirect } from "next/navigation";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { SignOutButton } from "@/components/admin/sign-out-button";

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
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="font-semibold">LumenX PH Admin</p>
          <p className="text-muted-foreground text-xs capitalize">
            {profile.fullName} · {profile.role}
          </p>
        </div>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
