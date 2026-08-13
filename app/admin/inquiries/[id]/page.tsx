import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { InquiryComposer } from "@/components/admin/inquiry-composer";
import { getInquiryThread, getCannedResponses } from "@/lib/queries/inquiries";

const MESSENGER_WINDOW_MS = 24 * 60 * 60 * 1000;

const SENDER_LABEL: Record<string, string> = { customer: "Customer", bot: "Bot", staff: "Staff" };

export default async function InquiryThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [inquiry, cannedResponses] = await Promise.all([getInquiryThread(id), getCannedResponses()]);
  if (!inquiry) notFound();

  const customer = inquiry.customers as unknown as { full_name: string; phone: string | null } | null;

  let canReply = true;
  if (inquiry.source === "messenger") {
    const lastInbound = [...inquiry.messages].reverse().find((m: Record<string, unknown>) => m.direction === "inbound");
    if (lastInbound) {
      const elapsed = Date.now() - new Date(lastInbound.sent_at as string).getTime();
      canReply = elapsed < MESSENGER_WINDOW_MS;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="space-y-2 rounded-md border p-4">
          {inquiry.messages.map((m: Record<string, unknown>) => (
            <div
              key={m.id as string}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                m.direction === "outbound" ? "bg-secondary ml-auto" : "bg-muted"
              }`}
            >
              <p className="text-muted-foreground mb-0.5 text-[10px] uppercase">
                {SENDER_LABEL[m.sender_type as string]}
              </p>
              {m.body as string}
            </div>
          ))}
        </div>
        <InquiryComposer inquiryId={id} canReply={canReply} cannedResponses={cannedResponses} />
      </div>

      <aside className="space-y-4 text-sm">
        <div>
          <p className="font-semibold">{customer?.full_name ?? "Unknown"}</p>
          <p className="text-muted-foreground">{customer?.phone ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Status</p>
          <Badge>{(inquiry.status as string).replace("_", " ")}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Source</p>
          <p className="capitalize">{(inquiry.source as string).replace("_", " ")}</p>
        </div>
        {inquiry.intent ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Matched intent</p>
            <p>{inquiry.intent as string}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Reference</p>
          <p className="font-mono text-xs">{inquiry.reference as string}</p>
        </div>
      </aside>
    </div>
  );
}
