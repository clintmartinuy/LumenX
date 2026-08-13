"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { calculateDistributionLines, retainedAmount } from "@/lib/partners";
import { centavos } from "@/lib/money";
import { getPnlReport } from "@/lib/queries/finance";

type Result = { error: string } | { success: true };

async function requireOwner() {
  const { user, profile } = await getCurrentStaffProfile();
  if (!profile || !user || profile.role !== "owner") return null;
  return { user, profile };
}

export async function previewDistribution(periodStart: string, periodEnd: string, distributedAmountPesos: number) {
  const supabase = await createClient();
  const pnl = await getPnlReport({ start: periodStart, end: periodEnd });

  const { data: partners } = await supabase.from("partners").select("id, full_name, equity_percent").eq("is_active", true);
  const distributedAmount = centavos(Math.round(distributedAmountPesos * 100));

  const lines = calculateDistributionLines(
    distributedAmount,
    (partners ?? []).map((p) => ({ partnerId: p.id as string, equityPercent: p.equity_percent as number })),
  );

  return {
    pnl,
    retained: retainedAmount(centavos(pnl.netProfit), distributedAmount),
    lines: lines.map((l) => ({
      ...l,
      partnerName: (partners ?? []).find((p) => p.id === l.partnerId)?.full_name as string,
    })),
  };
}

export async function finalizeDistribution(input: {
  periodStart: string;
  periodEnd: string;
  distributedAmountPesos: number;
}): Promise<Result> {
  const auth = await requireOwner();
  if (!auth) return { error: "Only the owner can finalize a distribution." };

  const supabase = await createClient();
  const pnl = await getPnlReport({ start: input.periodStart, end: input.periodEnd });
  const distributedAmount = centavos(Math.round(input.distributedAmountPesos * 100));

  const { data: partners } = await supabase.from("partners").select("id, equity_percent").eq("is_active", true);
  const lines = calculateDistributionLines(
    distributedAmount,
    (partners ?? []).map((p) => ({ partnerId: p.id as string, equityPercent: p.equity_percent as number })),
  );

  const { data: distribution, error: distError } = await supabase
    .from("profit_distributions")
    .insert({
      period_start: input.periodStart,
      period_end: input.periodEnd,
      revenue: pnl.revenue,
      cogs: pnl.cogs,
      gross_profit: pnl.grossProfit,
      operating_expenses: pnl.operatingExpenses,
      net_profit: pnl.netProfit,
      distributed_amount: distributedAmount,
      retained_amount: retainedAmount(centavos(pnl.netProfit), distributedAmount),
      status: "finalized",
      finalized_at: new Date().toISOString(),
      finalized_by: auth.user.id,
    })
    .select("id")
    .single();

  if (distError) return { error: distError.message };

  const { error: linesError } = await supabase.from("distribution_lines").insert(
    lines.map((l) => ({
      distribution_id: distribution.id,
      partner_id: l.partnerId,
      equity_percent_snapshot: l.equityPercentSnapshot,
      amount: l.amount,
    })),
  );
  if (linesError) return { error: linesError.message };

  await supabase.from("audit_log").insert({
    user_id: auth.user.id,
    action: "finalize_distribution",
    table_name: "profit_distributions",
    record_id: distribution.id,
    changes: { distributedAmount, periodStart: input.periodStart, periodEnd: input.periodEnd },
  });

  revalidatePath("/admin/partners");
  return { success: true };
}

export async function recordPayout(input: {
  partnerId: string;
  amountPesos: number;
  distributionId?: string;
  method: string;
  reference?: string;
  notes?: string;
}): Promise<Result> {
  const auth = await requireOwner();
  if (!auth) return { error: "Only the owner can record a payout." };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_payouts").insert({
    partner_id: input.partnerId,
    distribution_id: input.distributionId ?? null,
    amount: Math.round(input.amountPesos * 100),
    method: input.method,
    reference: input.reference || null,
    notes: input.notes || null,
  });
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: auth.user.id,
    action: "record_payout",
    table_name: "partner_payouts",
    changes: input,
  });

  revalidatePath("/admin/partners");
  return { success: true };
}

export async function addCapitalContribution(input: {
  partnerId: string;
  amountPesos: number;
  method: string;
  reference?: string;
  notes?: string;
}): Promise<Result> {
  const auth = await requireOwner();
  if (!auth) return { error: "Only the owner can add a contribution." };

  const supabase = await createClient();
  const { error } = await supabase.from("capital_contributions").insert({
    partner_id: input.partnerId,
    amount: Math.round(input.amountPesos * 100),
    method: input.method,
    reference: input.reference || null,
    notes: input.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/partners");
  revalidatePath("/admin/capital");
  return { success: true };
}
