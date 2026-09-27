"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Package as PackageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { deletePackage, savePackage, togglePackage } from "@/lib/actions/catalog";
import { DIET_TYPES } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { MenuItemRow } from "./menu-manager";

export type PackageRow = {
  id: string;
  name: string;
  description: string;
  pricePerPlate: number;
  dietType: string;
  items: string[];
  isActive: boolean;
};

export function PackageManager({ packages, menuItems }: { packages: PackageRow[]; menuItems: MenuItemRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState(packages);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PackageRow | null>(null);
  const [deleting, setDeleting] = useState<PackageRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => setRows(packages), [packages]);

  const nameById = new Map(menuItems.map((m) => [m.id, m.name]));

  function toggle(row: PackageRow, next: boolean) {
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    startTransition(async () => {
      const res = await togglePackage(row.id, next);
      if (!res.ok) {
        setRows(packages);
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
      const res = await deletePackage(target.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Deleted", variant: "success" });
        router.refresh();
      } else {
        setRows(packages);
        toast({ title: "Couldn't delete", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{rows.length}</span> package{rows.length === 1 ? "" : "s"} · guests choose one per booking
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add package
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageIcon className="h-6 w-6" />}
            title="No menu packages yet"
            description="Bundle your dishes into per-plate packages — e.g. Silver Veg, Golden Veg, Shahi Non-Veg."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create your first package
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.id} className={cn("flex flex-col p-5", !p.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-stone-900">{p.name}</h3>
                  <Badge className="mt-1 bg-stone-100 text-stone-600">{p.dietType.replace("_", "-")}</Badge>
                </div>
                <Toggle checked={p.isActive} onChange={(v) => toggle(p, v)} label={`Toggle ${p.name}`} />
              </div>
              <p className="mt-2.5 line-clamp-2 min-h-[2.4em] text-xs leading-relaxed text-stone-500">{p.description || "No description"}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.items.slice(0, 4).map((id) => (
                  <span key={id} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                    {nameById.get(id) ?? "?"}
                  </span>
                ))}
                {p.items.length > 4 ? (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                    +{p.items.length - 4} more
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
                <div>
                  <p className="font-display text-xl font-bold text-brand-800">
                    {formatINR(p.pricePerPlate)}
                    <span className="text-xs font-medium text-stone-400">/plate</span>
                  </p>
                  <p className="text-[11px] text-stone-400">{p.items.length} dishes</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(p)} className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PackageFormModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        pkg={editing}
        menuItems={menuItems}
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
        title="Delete package?"
        message={deleting ? `"${deleting.name}" will no longer be bookable. Existing bookings keep their pricing.` : ""}
        confirmLabel="Delete package"
        pending={deletePending}
      />
    </div>
  );
}

function PackageFormModal({
  open,
  onClose,
  pkg,
  menuItems,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  pkg: PackageRow | null;
  menuItems: MenuItemRow[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(599);
  const [dietType, setDietType] = useState("VEG");
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(pkg?.name ?? "");
    setDescription(pkg?.description ?? "");
    setPrice(pkg?.pricePerPlate ?? 599);
    setDietType(pkg?.dietType ?? "VEG");
    setIsActive(pkg?.isActive ?? true);
    setSelected(pkg?.items ?? []);
  }, [open, pkg]);

  function toggleItem(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submit() {
    const fd = new FormData();
    if (pkg) fd.set("id", pkg.id);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("pricePerPlate", String(price));
    fd.set("dietType", dietType);
    fd.set("isActive", String(isActive));
    for (const id of selected) fd.append("items", id);
    startTransition(async () => {
      const res = await savePackage(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Saved", variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={pkg ? "Edit package" : "New package"} description="Pick the dishes included in this per-plate package" size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Package name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Golden Veg Celebration" />
          </Field>
          <Field label="Diet type">
            <Select value={dietType} onChange={(e) => setDietType(e.target.value)}>
              {DIET_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Per-plate price (₹) *">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <div className="flex items-end">
            <p className="rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-500 ring-1 ring-stone-200/70">
              For 300 guests this package bills{" "}
              <span className="font-bold text-brand-700">{formatINR(price * 300)}</span> in catering.
            </p>
          </div>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this package special…" className="min-h-[60px]" />
        </Field>

        <div>
          <p className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-500">
            <span>Included dishes</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{selected.length} selected</span>
          </p>
          <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-xl bg-stone-50 p-2 ring-1 ring-stone-200/70 sm:grid-cols-2">
            {menuItems.map((m) => {
              const on = selected.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleItem(m.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                    on ? "border-brand-300 bg-white font-semibold text-brand-800" : "border-transparent bg-white/60 text-stone-600 hover:bg-white"
                  )}
                >
                  <span className="min-w-0 truncate">{m.name}</span>
                  {on ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200/70">
          <Toggle checked={isActive} onChange={setIsActive} label="Live" />
          <span className="text-sm text-stone-600">
            Bookable on your public page
            <span className="block text-xs text-stone-400">Guests can only select live packages</span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name || price <= 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pkg ? "Save changes" : "Create package"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
