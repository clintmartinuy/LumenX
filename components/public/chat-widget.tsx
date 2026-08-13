"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = { direction: "inbound" | "outbound"; body: string };

function getSessionId(): string {
  const key = "lumenx_chat_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { direction: "outbound", body: "Hi! Ask us about pricing, stock, fitment, or booking an installation." },
  ]);
  const [input, setInput] = useState("");
  const [needsContact, setNeedsContact] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !sessionId) setSessionId(getSessionId());
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!input.trim() || !sessionId || sending) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { direction: "inbound", body: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, fullName: name || undefined, phone: phone || undefined }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { direction: "outbound", body: data.reply }]);
      }
      if (data.needsHuman && !phone) {
        setNeedsContact(true);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open ? (
        <div className="bg-card flex h-[28rem] w-80 flex-col rounded-2xl border shadow-2xl">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-semibold">LumenX PH</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground text-sm" aria-label="Close chat">
              <X className="size-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.direction === "outbound" ? "bg-secondary" : "bg-primary text-primary-foreground ml-auto"}`}
              >
                {m.body}
              </div>
            ))}
          </div>
          {needsContact ? (
            <div className="space-y-2 border-t p-3">
              <p className="text-muted-foreground text-xs">Leave your name and number so a team member can follow up.</p>
              <Input placeholder="Name" className="h-7 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="09XXXXXXXXX" className="h-7 text-xs" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button size="sm" className="w-full rounded-full" onClick={() => setNeedsContact(false)}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 border-t p-3">
              <Input
                className="h-8 text-xs"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button size="sm" className="rounded-full" onClick={send} disabled={sending}>
                Send
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          className="h-12 w-12 rounded-full p-0 shadow-lg"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle className="size-5" />
        </Button>
      )}
    </div>
  );
}
