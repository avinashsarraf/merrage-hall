"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Save, UserRound } from "lucide-react";
import { updateProfile } from "@/lib/actions/hall";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({ currentName, currentPhone }: { currentName: string; currentPhone: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    fd.set("currentPassword", currentPassword);
    fd.set("newPassword", newPassword);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Profile updated", variant: "success" });
        setCurrentPassword("");
        setNewPassword("");
        router.refresh();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader title="Personal details" bordered />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" sub="Leave blank to keep your current password" bordered />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Current password">
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
          {newPassword && !currentPassword ? (
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
              Enter your current password to set a new one.
            </p>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
