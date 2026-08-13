import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DistributionWizard } from "@/components/admin/distribution-wizard";
import { PartnerTransactionDialog } from "@/components/admin/partner-transaction-dialog";
import { getPartnersSummary } from "@/lib/queries/partners";
import { centavos, formatCentavos } from "@/lib/money";

export default async function PartnersPage() {
  const partners = await getPartnersSummary();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Partners</h1>
        <div className="flex gap-2">
          <PartnerTransactionDialog partners={partners.map((p) => ({ id: p.id as string, full_name: p.full_name as string }))} type="contribution" />
          <PartnerTransactionDialog partners={partners.map((p) => ({ id: p.id as string, full_name: p.full_name as string }))} type="payout" />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead className="text-right">Equity %</TableHead>
              <TableHead className="text-right">Contributed</TableHead>
              <TableHead className="text-right">Distributed</TableHead>
              <TableHead className="text-right">Paid Out</TableHead>
              <TableHead className="text-right">Net Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id as string}>
                <TableCell>
                  <Link href={`/admin/partners/${p.id}`} className="hover:underline">
                    {p.full_name as string}
                  </Link>
                </TableCell>
                <TableCell className="text-right">{p.equity_percent as number}%</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(p.totalContributed))}</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(p.totalDistributed))}</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(p.totalPaidOut))}</TableCell>
                <TableCell className="text-right font-semibold">{formatCentavos(p.netBalance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DistributionWizard />
    </div>
  );
}
