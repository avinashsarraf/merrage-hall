"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deletePlan, savePlan, togglePlan } from "@/lib/actions/admin";
import { cn, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export type AdminPlanRow = {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  features: string[];
  maxStaff: number;
  maxBookings: number;
  customDomain: boolean;
  commissionPct: number;
  isActive: boolean;
  sortOrder: number;
};

export function PlanManager({ plans }: { plans: AdminPlanRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminPlanRow | null>(null);
  const [deleting, setDeleting] = useState<AdminPlanRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(row: AdminPlanRow, next: boolean) {
    startTransition(async () => {
      const res = await togglePlan(row.id, next);
      if (res.ok) {
        toast({ title: res.message ?? "Updated", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Failed", description: res.error, variant: "error" });
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    startTransition(async () => {
      const res = await deletePlan(deleting.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Deleted", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Couldn't delete", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{plans.length}</span> plan{plans.length === 1 ? "" : "s"} offered to venue owners
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <EmptyState icon={<Plus className="h-6 w-6" />} title="No plans" description="Create subscription plans for venue owners." action={<Button onClick={() => setCreating(true)}>Create plan</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className={cn("flex flex-col p-6", !p.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-stone-900">{p.name}</h3>
                  <p className="text-xs text-stone-500">{p.tagline || "—"}</p>
                </div>
                <Toggle checked={p.isActive} onChange={(v) => toggle(p, v)} label={`Toggle ${p.name}`} />
              </div>
              <p className="mt-3">
                <span className="font-display text-2xl font-bold text-brand-800">{formatINR(p.priceMonthly)}</span>
                <span className="text-xs text-stone-400">/mo</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                <Badge className="bg-stone-100 text-stone-600">{p.maxStaff === -1 ? "Unlimited staff" : `${p.maxStaff} staff`}</Badge>
                <Badge className="bg-stone-100 text-stone-600">{p.maxBookings === -1 ? "Unlimited bookings" : `${p.maxBookings} bookings/mo`}</Badge>
                <Badge className={p.customDomain ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-stone-100 text-stone-500"}>
                  {p.customDomain ? "Custom domain" : "Subdomain only"}
                </Badge>
                <Badge className="bg-gold-50 text-gold-800 ring-1 ring-gold-200">{p.commissionPct}% commission</Badge>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-stone-600">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
                {p.features.length > 5 ? <li className="text-xs text-stone-400">+{p.features.length - 5} more</li> : null}
              </ul>
              <div className="mt-5 flex justify-end gap-1 border-t border-stone-100 pt-4">
                <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleting(p)} className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PlanFormModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        plan={editing}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete plan?"
        message={deleting ? `"${deleting.name}" will be removed from the pricing page. Venues subscribed to it must be moved first.` : ""}
        confirmLabel="Delete plan"
        pending={deletePending}
      />
    </div>
  );
}

function PlanFormModal({
  open,
  onClose,
  plan,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  plan: AdminPlanRow | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState(2499);
  const [features, setFeatures] = useState("");
  const [maxStaff, setMaxStaff] = useState(2);
  const [maxBookings, setMaxBookings] = useState(40);
  const [commissionPct, setCommissionPct] = useState(7);
  const [customDomain, setCustomDomain] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);

  // reset on open
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setLastOpen(true);
    setName(plan?.name ?? "");
    setTagline(plan?.tagline ?? "");
    setPrice(plan?.priceMonthly ?? 2499);
    setFeatures((plan?.features ?? []).join("\n"));
    setMaxStaff(plan?.maxStaff ?? 2);
    setMaxBookings(plan?.maxBookings ?? 40);
    setCommissionPct(plan?.commissionPct ?? 7);
    setCustomDomain(plan?.customDomain ?? false);
    setIsActive(plan?.isActive ?? true);
    setSortOrder(plan?.sortOrder ?? 1);
  }
  if (!open && lastOpen) setLastOpen(false);

  function submit() {
    const fd = new FormData();
    if (plan) fd.set("id", plan.id);
    fd.set("name", name);
    fd.set("tagline", tagline);
    fd.set("priceMonthly", String(price));
    fd.set("features", features);
    fd.set("maxStaff", String(maxStaff));
    fd.set("maxBookings", String(maxBookings));
    fd.set("commissionPct", String(commissionPct));
    fd.set("customDomain", String(customDomain));
    fd.set("isActive", String(isActive));
    fd.set("sortOrder", String(sortOrder));
    startTransition(async () => {
      const res = await savePlan(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Saved", variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={plan ? `Edit ${plan.name}` : "New plan"} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Plan name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Growth" />
          </Field>
          <Field label="Tagline">
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="For venues ready to scale" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Price / month (₹)">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Max staff" hint="-1 = unlimited">
            <Input type="number" min={-1} value={maxStaff} onChange={(e) => setMaxStaff(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Max bookings/mo" hint="-1 = unlimited">
            <Input type="number" min={-1} value={maxBookings} onChange={(e) => setMaxBookings(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Commission %">
            <Input type="number" min={0} step="0.5" value={commissionPct} onChange={(e) => setCommissionPct(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </div>
        <Field label="Features — one per line *">
          <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={"Beautiful venue page\nUnlimited bookings\nCustom domain support"} className="min-h-[120px]" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-200/70">
            <Toggle checked={customDomain} onChange={setCustomDomain} label="Custom domain" />
            Custom domain
          </label>
          <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-200/70">
            <Toggle checked={isActive} onChange={setIsActive} label="Active" />
            Active
          </label>
          <Field label="Sort order">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {plan ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
