"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { deleteMenuItem, saveMenuItem, toggleMenuItem } from "@/lib/actions/catalog";
import { DIET_TYPES, MENU_CATEGORIES, menuCategoryLabel } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export type MenuItemRow = {
  id: string;
  name: string;
  category: string;
  dietType: string;
  pricePerPlate: number;
  description: string;
  isActive: boolean;
};

const dietBadge: Record<string, string> = {
  VEG: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  NON_VEG: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  VEGAN: "bg-lime-50 text-lime-700 ring-1 ring-lime-200",
  JAIN: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

export function MenuManager({ items }: { items: MenuItemRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState(items);
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<MenuItemRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MenuItemRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => setRows(items), [items]);

  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.category === filter);
  const categories = MENU_CATEGORIES.filter((c) => rows.some((r) => r.category === c.value));

  function toggle(row: MenuItemRow, next: boolean) {
    setRows((s) => s.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    startTransition(async () => {
      const res = await toggleMenuItem(row.id, next);
      if (!res.ok) {
        setRows(items);
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
      const res = await deleteMenuItem(target.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Deleted", variant: "success" });
        router.refresh();
      } else {
        setRows(items);
        toast({ title: "Couldn't delete", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === "ALL" ? "bg-brand-800 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            )}
          >
            All · {rows.length}
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === c.value ? "bg-brand-800 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              )}
            >
              {c.label} · {rows.filter((r) => r.category === c.value).length}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add dish
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="Your menu is empty"
            description="Add the dishes you serve so couples can browse them in your menu packages."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first dish
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Dish</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Diet</th>
                  <th className="px-5 py-3">Per plate</th>
                  <th className="px-5 py-3">Live</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={cn("border-b border-stone-50 transition hover:bg-brand-50/30", !r.isActive && "opacity-50")}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-stone-800">{r.name}</p>
                      {r.description ? <p className="text-xs text-stone-400">{r.description}</p> : null}
                    </td>
                    <td className="px-5 py-3 text-stone-600">{menuCategoryLabel(r.category)}</td>
                    <td className="px-5 py-3">
                      <Badge className={dietBadge[r.dietType] ?? dietBadge.VEG}>{r.dietType.replace("_", "-")}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums text-stone-700">{formatINR(r.pricePerPlate)}</td>
                    <td className="px-5 py-3">
                      <Toggle checked={r.isActive} onChange={(v) => toggle(r, v)} label={`Toggle ${r.name}`} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(r)} className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(r)} className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <MenuFormModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        item={editing}
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
        title="Delete dish?"
        message={deleting ? `"${deleting.name}" will be removed from your menu and any packages that include it.` : ""}
        confirmLabel="Delete dish"
        pending={deletePending}
      />
    </div>
  );
}

function MenuFormModal({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: MenuItemRow | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("STARTER");
  const [dietType, setDietType] = useState("VEG");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setCategory(item?.category ?? "STARTER");
    setDietType(item?.dietType ?? "VEG");
    setPrice(item?.pricePerPlate ?? 0);
    setDescription(item?.description ?? "");
    setIsActive(item?.isActive ?? true);
  }, [open, item]);

  function submit() {
    const fd = new FormData();
    if (item) fd.set("id", item.id);
    fd.set("name", name);
    fd.set("category", category);
    fd.set("dietType", dietType);
    fd.set("pricePerPlate", String(price));
    fd.set("description", description);
    fd.set("isActive", String(isActive));
    startTransition(async () => {
      const res = await saveMenuItem(fd);
      if (res.ok) {
        toast({ title: res.message ?? "Saved", variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't save", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit dish" : "Add dish"}>
      <div className="space-y-4">
        <Field label="Dish name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paneer Tikka Angara" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Course">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {MENU_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Diet">
            <Select value={dietType} onChange={(e) => setDietType(e.target.value)}>
              {DIET_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Per-plate price (₹) *" hint="Contribution to the per-plate package price">
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short, appetising description…" className="min-h-[60px]" />
        </Field>
        <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200/70">
          <Toggle checked={isActive} onChange={setIsActive} label="Live" />
          <span className="text-sm text-stone-600">
            Visible on your public menu
            <span className="block text-xs text-stone-400">Hidden dishes stay usable inside packages</span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {item ? "Save changes" : "Add dish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
