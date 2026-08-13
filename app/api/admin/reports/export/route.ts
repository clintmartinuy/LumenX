import { NextRequest, NextResponse } from "next/server";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { getSalesByProduct } from "@/lib/queries/finance";
import { centavos, formatCentavos } from "@/lib/money";

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function presetRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start = new Date(now);
  if (preset === "7d") start.setDate(start.getDate() - 7);
  else if (preset === "mtd") start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (preset === "ytd") start = new Date(now.getFullYear(), 0, 1);
  else start.setDate(start.getDate() - 30);
  return { start: start.toISOString(), end };
}

export async function GET(request: NextRequest) {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preset = request.nextUrl.searchParams.get("preset") ?? "30d";
  const rows = await getSalesByProduct(presetRange(preset));

  const header = ["Product", "Units", "Revenue", "Gross Profit", "Margin %"];
  const csv = [header, ...rows.map((r) => [r.name, r.units, formatCentavos(centavos(r.revenue)), formatCentavos(centavos(r.grossProfit)), r.marginPct.toFixed(1)])]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="report-${preset}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
