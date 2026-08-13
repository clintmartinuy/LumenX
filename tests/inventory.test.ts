import { describe, expect, it } from "vitest";
import { allocateLandedCost, nextPurchaseOrderStatus } from "@/lib/inventory";
import { centavos } from "@/lib/money";

describe("allocateLandedCost", () => {
  it("matches the §13 Phase 3 acceptance example: 10 @ ₱1,200 + ₱500 freight = ₱1,250/unit", () => {
    const [line] = allocateLandedCost(
      [{ productId: "p1", quantityOrdered: 10, unitCost: centavos(120000) }],
      centavos(50000),
    );
    expect(line.landedUnitCost).toBe(125000);
  });

  it("allocates freight across multiple lines by value share", () => {
    const lines = allocateLandedCost(
      [
        { productId: "a", quantityOrdered: 10, unitCost: centavos(100000) }, // value 1,000,000
        { productId: "b", quantityOrdered: 5, unitCost: centavos(200000) }, // value 1,000,000
      ],
      centavos(20000), // split evenly: 10,000 each
    );
    expect(lines[0].landedUnitCost).toBe(101000); // (1,000,000 + 10,000) / 10
    expect(lines[1].landedUnitCost).toBe(202000); // (1,000,000 + 10,000) / 5
  });

  it("returns a fixed per-unit cost regardless of partial receiving batches (no double-counting freight)", () => {
    const orderedLines = [{ productId: "a", quantityOrdered: 10, unitCost: centavos(120000) }];
    const extraCosts = centavos(50000);

    // Simulate calling this twice — once for a batch of 6, once for the remaining 4.
    const firstBatch = allocateLandedCost(orderedLines, extraCosts);
    const secondBatch = allocateLandedCost(orderedLines, extraCosts);

    expect(firstBatch[0].landedUnitCost).toBe(125000);
    expect(secondBatch[0].landedUnitCost).toBe(125000);
  });

  it("returns an empty array for no lines", () => {
    expect(allocateLandedCost([], centavos(0))).toEqual([]);
  });
});

describe("nextPurchaseOrderStatus", () => {
  it("is 'partial' when a receipt of 6 of 10 leaves quantity outstanding (§13 Phase 3)", () => {
    expect(
      nextPurchaseOrderStatus([{ quantityOrdered: 10, quantityReceived: 6 }]),
    ).toBe("partial");
  });

  it("is 'received' once total received meets total ordered", () => {
    expect(
      nextPurchaseOrderStatus([
        { quantityOrdered: 10, quantityReceived: 10 },
        { quantityOrdered: 5, quantityReceived: 5 },
      ]),
    ).toBe("received");
  });
});
