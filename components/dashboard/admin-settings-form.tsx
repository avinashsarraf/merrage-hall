"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { savePlatformSettings } from "@/lib/actions/admin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AdminSettingsForm({ settings }: { settings: { siteName: string; commissionPct: string; supportEmail: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(settings);

  function submit() {
    const fd = new FormData();
    fd.set("siteName", form.siteName);
    fd.set("commissionPct", form.commissionPct);
    fd.set("supportEmail", form.supportEmail);
    startTransition(async () => {
      const res = await savePlatformSettings(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Settings saved", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Platform settings" sub="Applies across the marketplace & dashboards" bordered />
      <CardBody className="space-y-4">
        <Field label="Platform name">
          <Input value={form.siteName} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Default commission %" hint="Used for reporting when a venue has no plan">
            <Input
              type="number"
              min={0}
              step="0.5"
              value={form.commissionPct}
              onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
            />
          </Field>
          <Field label="Support email">
            <Input type="email" value={form.supportEmail} onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={submit} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save settings
              </>
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
