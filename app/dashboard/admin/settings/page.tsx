import { requireAdmin } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/queries";
import { AdminSettingsForm } from "@/components/dashboard/admin-settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPlatformSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">Platform-wide configuration</p>
      </div>
      <AdminSettingsForm
        settings={{
          siteName: settings.siteName ?? "MerrageHall",
          commissionPct: settings.commissionPct ?? "5",
          supportEmail: settings.supportEmail ?? "support@merragehall.com",
        }}
      />
    </div>
  );
}
