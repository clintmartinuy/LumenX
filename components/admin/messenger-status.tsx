"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendTestMessageAction, setupMessengerProfileAction } from "@/lib/messenger/actions";

export function MessengerStatus({ configured }: { configured: boolean }) {
  const [psid, setPsid] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="max-w-lg space-y-3 rounded-md border p-4 text-sm">
      <p>
        Connection status:{" "}
        <span className={configured ? "text-green-500" : "text-destructive"}>
          {configured ? "Page access token configured" : "Not configured"}
        </span>
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || !configured}
        onClick={() =>
          startTransition(async () => {
            const result = await setupMessengerProfileAction();
            setMessage("error" in result ? result.error : "Greeting, Get Started, and persistent menu configured.");
          })
        }
      >
        Configure greeting &amp; menu
      </Button>
      <div className="flex gap-2">
        <Input placeholder="Test recipient PSID" value={psid} onChange={(e) => setPsid(e.target.value)} />
        <Button
          size="sm"
          disabled={isPending || !configured}
          onClick={() =>
            startTransition(async () => {
              const result = await sendTestMessageAction(psid);
              setMessage("error" in result ? result.error : "Test message sent.");
            })
          }
        >
          Send test message
        </Button>
      </div>
      {message ? <p className="text-muted-foreground text-xs">{message}</p> : null}
    </div>
  );
}
