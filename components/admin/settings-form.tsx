"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/settings/actions";

type Settings = {
  business_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  autoreply_enabled: boolean;
  autoreply_after_hours_only: boolean;
} | null;

export function SettingsForm({ settings }: { settings: Settings }) {
  const [businessName, setBusinessName] = useState(settings?.business_name ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [address, setAddress] = useState(settings?.address ?? "");
  const [autoreplyEnabled, setAutoreplyEnabled] = useState(settings?.autoreply_enabled ?? true);
  const [afterHoursOnly, setAfterHoursOnly] = useState(settings?.autoreply_after_hours_only ?? false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings({
        businessName,
        phone,
        email,
        address,
        autoreplyEnabled,
        autoreplyAfterHoursOnly: afterHoursOnly,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settingsPhone">Phone</Label>
          <Input id="settingsPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settingsEmail">Email</Label>
          <Input id="settingsEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="settingsAddress">Address</Label>
        <Input id="settingsAddress" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={autoreplyEnabled} onChange={(e) => setAutoreplyEnabled(e.target.checked)} />
        Auto-reply enabled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={afterHoursOnly} onChange={(e) => setAfterHoursOnly(e.target.checked)} />
        Only auto-reply after hours
      </label>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {saved ? <p className="text-sm text-green-500">Saved.</p> : null}
      <Button size="sm" onClick={save} disabled={isPending}>
        {isPending ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}
