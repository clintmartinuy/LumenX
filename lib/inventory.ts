import { centavos, type Centavos, splitByWeight } from "@/lib/money";

export type OrderedLine = {
  productId: string;
  quantityOrdered: number;
  unitCost: Centavos;
};

export type LandedUnitCost = {
  productId: string;
  landedUnitCost: Centavos;
};

// Computes a *fixed* landed unit cost per PO line, from the full ordered quantity and
// value share of freight/other costs — independent of how many units have been received
// so far. Always recompute from the complete PO items list (quantity_ordered, not
// quantity received in any one batch): since the result only depends on the PO's own
// items and extraCosts, it's identical every time this runs, so calling it again on a
// second partial-receipt batch can never double-allocate freight into the same units.
// §13 Phase 3 acceptance: 10 units @ ₱1,200 + ₱500 freight = ₱1,250/unit.
export function allocateLandedCost(lines: OrderedLine[], extraCosts: Centavos): LandedUnitCost[] {
  if (lines.length === 0) return [];

  const lineValues = lines.map((l) => l.quantityOrdered * l.unitCost);
  const allocatedExtras = splitByWeight(extraCosts, lineValues);

  return lines.map((line, i) => ({
    productId: line.productId,
    landedUnitCost: centavos(line.unitCost + Math.round(allocatedExtras[i] / line.quantityOrdered)),
  }));
}

// Called only after a receiving action (so totalReceived is always > 0 here) — 'draft',
// 'ordered', and 'cancelled' are explicit status transitions managed elsewhere, not
// derived from received quantity.
export function nextPurchaseOrderStatus(
  items: { quantityOrdered: number; quantityReceived: number }[],
): "partial" | "received" {
  const totalOrdered = items.reduce((sum, i) => sum + i.quantityOrdered, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.quantityReceived, 0);

  return totalReceived >= totalOrdered ? "received" : "partial";
}
