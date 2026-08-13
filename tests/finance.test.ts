import { describe, expect, it } from "vitest";
import { averageOrderValue, grossMarginPct, netMarginPct, netProfit } from "@/lib/margin";
import { calculateDistributionLines, partnerNetBalance, retainedAmount } from "@/lib/partners";
import { centavos } from "@/lib/money";

describe("grossMarginPct", () => {
  it("matches the §9.8 formula: gross_profit / (total - tax) * 100", () => {
    // total=1000, tax=0, gross_profit=400 -> 40%
    expect(grossMarginPct(centavos(400), centavos(1000), centavos(0))).toBe(40);
  });

  it("excludes tax from the base", () => {
    // total=1100 (incl. 100 tax), gross_profit=400 -> base=1000 -> 40%
    expect(grossMarginPct(centavos(400), centavos(1100), centavos(100))).toBe(40);
  });

  it("returns 0 when the tax-excluded base is zero or negative", () => {
    expect(grossMarginPct(centavos(0), centavos(0), centavos(0))).toBe(0);
  });
});

describe("netProfit / netMarginPct", () => {
  it("net_profit = sum(gross_profit) - sum(expenses)", () => {
    expect(netProfit(centavos(500000), centavos(120000))).toBe(380000);
  });

  it("computes net margin against total revenue", () => {
    expect(netMarginPct(centavos(380000), centavos(1000000))).toBe(38);
  });
});

describe("averageOrderValue", () => {
  it("divides revenue by order count, rounding to the nearest centavo", () => {
    expect(averageOrderValue(centavos(1000), 3)).toBe(333);
  });

  it("returns 0 for zero orders instead of dividing by zero", () => {
    expect(averageOrderValue(centavos(1000), 0)).toBe(0);
  });
});

describe("calculateDistributionLines", () => {
  it("matches the exact §13 Phase 8 acceptance example: 40/30/20/10 splitting ₱100,000.01", () => {
    const lines = calculateDistributionLines(centavos(10_000_001), [
      { partnerId: "a", equityPercent: 40 },
      { partnerId: "b", equityPercent: 30 },
      { partnerId: "c", equityPercent: 20 },
      { partnerId: "d", equityPercent: 10 },
    ]);

    expect(lines.map((l) => l.amount)).toEqual([4_000_001, 3_000_000, 2_000_000, 1_000_000]);
    expect(lines.reduce((sum, l) => sum + l.amount, 0)).toBe(10_000_001);
  });

  it("carries the equity_percent_snapshot per line", () => {
    const lines = calculateDistributionLines(centavos(1000), [{ partnerId: "a", equityPercent: 100 }]);
    expect(lines[0].equityPercentSnapshot).toBe(100);
  });
});

describe("retainedAmount", () => {
  it("retained = net_profit - distributed_amount", () => {
    expect(retainedAmount(centavos(500000), centavos(300000))).toBe(200000);
  });
});

describe("partnerNetBalance", () => {
  it("balance = contributed + distributed - paid out", () => {
    expect(
      partnerNetBalance({
        totalContributed: centavos(1000000),
        totalDistributed: centavos(200000),
        totalPaidOut: centavos(150000),
      }),
    ).toBe(1050000);
  });
});
