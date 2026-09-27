"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Plus, Trash2, UserPlus } from "lucide-react";
import { addStaff, removeStaff } from "@/lib/actions/hall";
import { formatDate, initials } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

export function StaffManager({ staff, maxStaff }: { staff: StaffRow[]; maxStaff: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<StaffRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    startTransition(async () => {
      const res = await removeStaff(deleting.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Removed", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Couldn't remove", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{staff.length}</span> staff account{staff.length === 1 ? "" : "s"}
          {maxStaff !== -1 ? <span className="text-stone-400"> · plan limit {maxStaff}</span> : <span className="text-stone-400"> · unlimited on your plan</span>}
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" /> Add staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title="No staff accounts yet"
            description="Give your managers and coordinators their own login to manage bookings & the calendar."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first staff member
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {staff.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-sm font-bold text-gold-950">
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-stone-800">{s.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-stone-500">
                  <Mail className="h-3 w-3 shrink-0 text-stone-300" />
                  {s.email}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-400">Added {formatDate(s.createdAt)}</p>
              </div>
              <button
                onClick={() => setDeleting(s)}
                className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <StaffFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Remove staff member?"
        message={deleting ? `${deleting.name} will lose access to this venue's dashboard. Their login is deleted.` : ""}
        confirmLabel="Remove access"
        pending={deletePending}
      />
    </div>
  );
}

function StaffFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("password", password);
    startTransition(async () => {
      const res = await addStaff(fd);
      if (res.ok) {
        toast({ title: "Staff account created", description: res.message, variant: "success" });
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        onSaved();
      } else {
        toast({ title: "Couldn't add staff", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add staff member" description="They can log in and manage bookings, calendar & menu">
      <div className="space-y-4">
        <Field label="Full name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arjun Mehta" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email *">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="arjun@yourvenue.in" />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
          </Field>
        </div>
        <Field label="Temporary password *" hint="At least 8 characters — they can change it after logging in">
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g. Welcome@123" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name || !email || !password}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
