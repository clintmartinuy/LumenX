import { centavos, splitByWeight, type Centavos } from "@/lib/money";

export type PartnerEquity = { partnerId: string; equityPercent: number };
export type DistributionLine = { partnerId: string; equityPercentSnapshot: number; amount: Centavos };

// Splits distributedAmount across partners by equity_percent, remainder centavos going to
// the largest-equity partner (§9.9) — directly reuses lib/money.ts's splitByWeight, which
// is already verified against this exact scenario (4 partners at 40/30/20/10 splitting
// ₱100,000.01 — see tests/money.test.ts).
export function calculateDistributionLines(
  distributedAmount: Centavos,
  partners: PartnerEquity[],
): DistributionLine[] {
  const shares = splitByWeight(
    distributedAmount,
    partners.map((p) => p.equityPercent),
  );

  return partners.map((p, i) => ({
    partnerId: p.partnerId,
    equityPercentSnapshot: p.equityPercent,
    amount: shares[i],
  }));
}

export function retainedAmount(netProfit: Centavos, distributedAmount: Centavos): Centavos {
  return centavos(netProfit - distributedAmount);
}

export type PartnerBalance = {
  totalContributed: Centavos;
  totalDistributed: Centavos; // sum of distribution_lines.amount — what they're entitled to
  totalPaidOut: Centavos; // sum of partner_payouts.amount — what's actually been paid,
  // whether linked to a distribution or a standalone drawing against balance (§5.5)
};

export function partnerNetBalance(balance: PartnerBalance): Centavos {
  return centavos(balance.totalContributed + balance.totalDistributed - balance.totalPaidOut);
}
