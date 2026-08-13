import { NextResponse } from "next/server";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { getInventoryList } from "@/lib/queries/inventory";
import { centavos, formatCentavos } from "@/lib/money";

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET() {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getInventoryList();

  const header = ["SKU", "Name", "On Hand", "Avg Cost", "Stock Value", "Retail", "Margin %", "Status"];
  const rows = items.map((item) => [
    item.sku as string,
    item.name as string,
    item.quantityOnHand,
    formatCentavos(centavos(item.averageUnitCost)),
    formatCentavos(centavos(item.stockValue)),
    formatCentavos(centavos(item.retail_price as number)),
    item.marginPct.toFixed(1),
    item.status,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
