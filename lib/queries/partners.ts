import "server-only";
import { createClient } from "@/lib/supabase/server";
import { partnerNetBalance } from "@/lib/partners";
import { centavos } from "@/lib/money";

export async function getPartnersSummary() {
  const supabase = await createClient();

  const [{ data: partners }, { data: contributions }, { data: distributionLines }, { data: payouts }] = await Promise.all([
    supabase.from("partners").select("*").order("equity_percent", { ascending: false }),
    supabase.from("capital_contributions").select("partner_id, amount"),
    supabase.from("distribution_lines").select("partner_id, amount"),
    supabase.from("partner_payouts").select("partner_id, amount"),
  ]);

  return (partners ?? []).map((p) => {
    const totalContributed = (contributions ?? []).filter((c) => c.partner_id === p.id).reduce((s, c) => s + (c.amount as number), 0);
    const totalDistributed = (distributionLines ?? []).filter((d) => d.partner_id === p.id).reduce((s, d) => s + (d.amount as number), 0);
    const totalPaidOut = (payouts ?? []).filter((po) => po.partner_id === p.id).reduce((s, po) => s + (po.amount as number), 0);

    return {
      ...p,
      totalContributed,
      totalDistributed,
      totalPaidOut,
      netBalance: partnerNetBalance({
        totalContributed: centavos(totalContributed),
        totalDistributed: centavos(totalDistributed),
        totalPaidOut: centavos(totalPaidOut),
      }),
    };
  });
}

export async function getPartnerStatement(partnerId: string) {
  const supabase = await createClient();
  const [{ data: partner }, { data: contributions }, { data: distributionLines }, { data: payouts }] = await Promise.all([
    supabase.from("partners").select("*").eq("id", partnerId).maybeSingle(),
    supabase.from("capital_contributions").select("*").eq("partner_id", partnerId).order("contributed_at"),
    supabase.from("distribution_lines").select("*, profit_distributions(period_start, period_end)").eq("partner_id", partnerId),
    supabase.from("partner_payouts").select("*").eq("partner_id", partnerId).order("paid_at"),
  ]);

  return { partner, contributions: contributions ?? [], distributionLines: distributionLines ?? [], payouts: payouts ?? [] };
}

export async function getDistributions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profit_distributions").select("*").order("period_start", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
