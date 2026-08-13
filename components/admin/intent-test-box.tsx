"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { testIntentAction, type TestIntentResult } from "@/lib/autoreply/test-action";

export function IntentTestBox() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<TestIntentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await testIntentAction(message);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult(res);
    });
  }

  return (
    <div className="max-w-lg space-y-3 rounded-md border p-4">
      <p className="font-semibold">Intent test box</p>
      <div className="flex gap-2">
        <Input
          placeholder="magkano po yung 3 inch bi-led fog?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <Button size="sm" onClick={run} disabled={isPending}>
          Test
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {result ? (
        <div className="bg-muted space-y-1 rounded-md p-3 text-xs">
          <p>
            Type: <span className="font-mono">{result.type}</span>
          </p>
          <p>
            Matched intent: <span className="font-mono">{result.matchedKey ?? "none"}</span>
          </p>
          <p>Confidence: {(result.confidence * 100).toFixed(0)}%</p>
          {result.renderedResponse ? <p className="mt-2 border-t pt-2">{result.renderedResponse}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
