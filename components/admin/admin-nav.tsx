"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffRole } from "@/lib/auth/roles";

const NAV_ITEMS: { href: string; label: string; minRole?: StaffRole }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/purchases", label: "Purchases", minRole: "admin" },
  { href: "/admin/reports", label: "Reports", minRole: "admin" },
  { href: "/admin/capital", label: "Capital", minRole: "admin" },
  { href: "/admin/partners", label: "Partners", minRole: "admin" },
  { href: "/admin/settings", label: "Settings", minRole: "admin" },
];

const ROLE_RANK: Record<StaffRole, number> = { viewer: 0, staff: 1, admin: 2, owner: 3 };

export function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b px-6">
      {NAV_ITEMS.filter((item) => !item.minRole || ROLE_RANK[role] >= ROLE_RANK[item.minRole]).map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
