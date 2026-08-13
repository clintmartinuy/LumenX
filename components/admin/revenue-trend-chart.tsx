"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { centavos, formatCentavos } from "@/lib/money";

export function RevenueTrendChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 100)}`} width={50} />
        <Tooltip
          formatter={(value) => formatCentavos(centavos(typeof value === "number" ? value : Number(value)))}
          labelFormatter={(d) => d}
        />
        <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
