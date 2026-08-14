"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";
import { submitContactForm } from "@/lib/inquiries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm({
  defaultProductSku,
  defaultSubject,
  defaultCustomerType,
}: {
  defaultProductSku?: string;
  defaultSubject?: string;
  defaultCustomerType?: "b2c" | "b2b";
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string; botReply?: string } | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      customerType: defaultCustomerType ?? "b2c",
      subject: defaultSubject ?? "",
      productSku: defaultProductSku ?? "",
    },
  });
  const customerType = watch("customerType");

  const onSubmit = (data: InquiryInput) => {
    setResult(null);
    startTransition(async () => {
      const response = await submitContactForm(data);
      if ("error" in response) {
        setResult({ ok: false, message: response.error });
      } else {
        setResult({
          ok: true,
          message: `Thanks! Your inquiry (${response.reference}) has been sent — we'll get back to you shortly.`,
          botReply: response.botReply,
        });
      }
    });
  };

  if (result?.ok) {
    return (
      <div className="space-y-3">
        <p className="rounded-md border p-4 text-sm">{result.message}</p>
        {result.botReply ? (
          <div className="bg-secondary/50 rounded-md border p-4 text-sm">
            <p className="text-muted-foreground mb-1 text-xs font-medium">Quick answer</p>
            <p>{result.botReply}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Honeypot — hidden from real visitors via CSS, not `hidden`/`display:none` (some
          bots skip those), left blank by humans, aria-hidden from screen readers too. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="companyWebsite">Company website</label>
        <input id="companyWebsite" tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Name</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName ? <p className="text-destructive text-sm">{errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="09XXXXXXXXX" {...register("phone")} />
          {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerType">I am a</Label>
        <select
          id="customerType"
          className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
          {...register("customerType")}
        >
          <option value="b2c">Individual customer</option>
          <option value="b2b">Shop / reseller (B2B)</option>
        </select>
      </div>

      {customerType === "b2b" ? (
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" {...register("businessName")} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="subject">Subject (optional)</Label>
        <Input id="subject" {...register("subject")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{customerType === "b2b" ? "Products & quantities needed" : "Message"}</Label>
        <textarea
          id="message"
          rows={4}
          placeholder={customerType === "b2b" ? "e.g. 2\" White Foglights x20, 3\" Tri-Color x10..." : undefined}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          {...register("message")}
        />
        {errors.message ? <p className="text-destructive text-sm">{errors.message.message}</p> : null}
      </div>

      {result && !result.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {result.message}
        </p>
      ) : null}

      <Button type="submit" className="rounded-full font-semibold" disabled={isPending}>
        {isPending ? "Sending..." : "Send Inquiry"}
      </Button>
    </form>
  );
}
