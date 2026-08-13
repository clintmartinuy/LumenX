"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendStaffReply, updateInquiryStatus } from "@/lib/inquiries/admin-actions";

type Canned = { key: string; name: string; response_template: string };

export function InquiryComposer({
  inquiryId,
  canReply,
  cannedResponses,
}: {
  inquiryId: string;
  canReply: boolean;
  cannedResponses: Canned[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function send() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendStaffReply(inquiryId, body.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  if (!canReply) {
    return (
      <p className="text-muted-foreground rounded-md border p-3 text-sm">
        The Messenger 24-hour window has closed for this thread — replies aren&apos;t available here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {cannedResponses.map((c) => (
          <button
            key={c.key}
            className="bg-secondary rounded-full px-2 py-0.5 text-xs"
            onClick={() => setBody(c.response_template)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <textarea
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        rows={3}
        placeholder="Type a reply..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={send} disabled={isPending}>
          {isPending ? "Sending..." : "Send reply"}
        </Button>
        <button
          className="text-destructive text-xs"
          onClick={() =>
            startTransition(async () => {
              await updateInquiryStatus(inquiryId, "spam");
              router.refresh();
            })
          }
        >
          Mark spam
        </button>
      </div>
    </div>
  );
}
