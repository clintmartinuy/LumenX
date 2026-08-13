import { IntentTestBox } from "@/components/admin/intent-test-box";
import { SettingsForm } from "@/components/admin/settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*").maybeSingle();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-4 text-lg font-semibold">Settings</h1>
        <SettingsForm settings={settings} />
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold">Auto-reply</h2>
        <IntentTestBox />
      </div>
    </div>
  );
}
