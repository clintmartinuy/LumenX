import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/lib/queries/catalog";

const LABELS: Record<StockStatus, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

const VARIANTS: Record<StockStatus, "default" | "secondary" | "destructive"> = {
  in_stock: "default",
  low_stock: "secondary",
  out_of_stock: "destructive",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
