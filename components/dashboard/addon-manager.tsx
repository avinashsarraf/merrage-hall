"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { deleteAddon, saveAddon, toggleAddon } from "@/lib/actions/catalog";
import { ADDON_CATEGORIES, addonCategoryLabel } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { AddonCategoryIcon } from "./category-icon";

export type AddonRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  isActive: boolean;
};

export function AddonManager({ addons }: { addons: AddonRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState(addons);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AddonRow | null>(null);
  const [deleting, setDeleting] = useState<AddonRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => setRows(addons), [addons]);

  function toggle(row: AddonRow, next: boolean) {
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    startTransition(async () => {
      const res = await toggleAddon(row.id, next);
      if (!res.ok) {
        setRows(addons);
        toast({ title: "Couldn't update", description: res.error, variant: "error" });
      } else {
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const target = deleting;
    setRows((s) => s.filter((r) => r.id !== target.id));
    startTransition(async () => {
      const res = await deleteAddon(target.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Deleted", variant: "success" });
        router.refresh();
      } else {
        setRows(addons);
        toast({ title: "Couldn't delete", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{rows.length}</span> add-on{rows.length === 1 ? "" : "s"} · extras guests can add to any booking
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add add-on
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="No add-ons yet"
            description="Décor, lighting, DJ, vintage car entries — add-ons boost every booking's value."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first add-on
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => (
            <Card key={a.id} className={cn("flex flex-col p-5", !a.isActive && "opacity-60")}>
              <div className="flex items-start gap-3.5">
                <AddonCategoryIcon category={a.category} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold text-stone-900">{a.name}</h3>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{addonCategoryLabel(a.category)}</p>
                </div>
                <Toggle checked={a.isActive} onChange={(v) => toggle(a, v)} label={`Toggle ${a.name}`} />
              </div>
              <p className="mt-3 line-clamp-2 min-h-[2.4em] text-xs leading-relaxed text-stone-500">{a.description || "No description"}</p>
              <div className="mt-3 flex items-end justify-between border-t border-stone-100 pt-3.5">
                <div>
                  <p className="font-display text-lg font-bold text-brand-800">{formatINR(a.price)}</p>
                  <p className="text-[11px] text-stone-400">{a.unit}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(a)} className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(a)} className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddonFormModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        addon={editing}
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
        title="Delete add-on?"
        message={deleting ? `"${deleting.name}" will be removed from your catalog. Existing bookings keep their pricing.` : ""}
        confirmLabel="Delete add-on"
        pending={deletePending}
      />
    </div>
  );
}

function AddonFormModal({
  open,
  onClose,
  addon,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  addon: AddonRow | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("DECOR");
  const [price, setPrice] = useState(10000);
  const [unit, setUnit] = useState("per event");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(addon?.name ?? "");
    setCategory(addon?.category ?? "DECOR");
    setPrice(addon?.price ?? 10000);
    setUnit(addon?.unit ?? "per event");
    setDescription(addon?.description ?? "");
    setIsActive(addon?.isActive ?? true);
  }, [open, addon]);

  function submit() {
    const fd = new FormData();
    if (addon) fd.set("id", addon.id);
    fd.set("name", name);
    fd.set("category", category);
    fd.set("price", String(price));
    fd.set("unit", unit);
    fd.set("description", description);
    fd.set("isActive", String(isActive));
    startTransition(async () => {
      const res = await saveAddon(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Saved", variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={addon ? "Edit add-on" : "New add-on"}>
      <div className="space-y-4">
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Royal Floral Mandap" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {ADDON_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Price (₹) *">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </div>
        <Field label="Unit" hint="How the price is charged">
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="per event / per day / per piece" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included…" className="min-h-[60px]" />
        </Field>
        <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200/70">
          <Toggle checked={isActive} onChange={setIsActive} label="Live" />
          <span className="text-sm text-stone-600">
            Bookable on your public page
            <span className="block text-xs text-stone-400">Hidden add-ons can't be added to new bookings</span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name || price <= 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {addon ? "Save changes" : "Add add-on"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
