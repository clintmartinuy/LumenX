import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getInquiries } from "@/lib/queries/inquiries";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "outline",
  auto_answered: "secondary",
  needs_human: "destructive",
  in_progress: "default",
  quoted: "default",
  converted: "default",
  closed: "outline",
  spam: "outline",
};

const STATUSES = ["new", "auto_answered", "needs_human", "in_progress", "quoted", "converted", "closed", "spam"];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const inquiries = await getInquiries({ status });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
      <aside className="space-y-1 text-sm">
        <Link href="/admin/inquiries" className={`block rounded-md px-2 py-1 ${!status ? "bg-secondary font-medium" : "text-muted-foreground"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/inquiries?status=${s}`}
            className={`block rounded-md px-2 py-1 capitalize ${status === s ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </aside>

      <div className="divide-border/60 divide-y rounded-md border">
        {inquiries.map((inq) => {
          const customer = inq.customers as unknown as { full_name: string; phone: string | null } | null;
          return (
            <Link
              key={inq.id as string}
              href={`/admin/inquiries/${inq.id}`}
              className="hover:bg-muted flex items-center justify-between gap-4 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{customer?.full_name ?? "Unknown"}</p>
                <p className="text-muted-foreground truncate text-xs">{inq.message as string}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {new Date(inq.created_at as string).toLocaleDateString("en-PH")}
                </span>
                <Badge variant={STATUS_VARIANT[inq.status as string]}>{(inq.status as string).replace("_", " ")}</Badge>
              </div>
            </Link>
          );
        })}
        {inquiries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No inquiries.</p>
        ) : null}
      </div>
    </div>
  );
}
