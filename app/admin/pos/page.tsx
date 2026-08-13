import { PosTerminal } from "@/components/admin/pos/pos-terminal";
import { getPosCatalog } from "@/lib/queries/pos";
import { getCurrentStaffProfile } from "@/lib/auth/roles";

export default async function PosPage() {
  const [{ products, services, categories }, { profile }] = await Promise.all([
    getPosCatalog(),
    getCurrentStaffProfile(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Point of Sale</h1>
      <PosTerminal products={products} services={services} categories={categories} role={profile?.role ?? "staff"} />
    </div>
  );
}
