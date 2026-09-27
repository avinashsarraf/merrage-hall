"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, MapPin } from "lucide-react";
import { setHallPlan, setHallStatus } from "@/lib/actions/admin";
import { HALL_STATUS_META } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { Photo } from "@/components/ui/photo";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { Building2 } from "lucide-react";

export type AdminHallRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  capacity: number;
  image: string | null;
  ownerName: string;
  ownerEmail: string;
  status: string;
  createdAt: string;
  planId: string | null;
  planName: string | null;
};

export function AdminHallsTable({ halls, plans }: { halls: AdminHallRow[]; plans: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [statusOv, setStatusOv] = useState<Record<string, string>>({});
  const [planOv, setPlanOv] = useState<Record<string, string>>({});

  function changeStatus(row: AdminHallRow, status: string) {
    setStatusOv((s) => ({ ...s, [row.id]: status }));
    startTransition(async () => {
      const res = await setHallStatus(row.id, status);
      if (res.ok) {
        toast({ title: res.message ?? "Updated", variant: "success" });
        router.refresh();
      } else {
        setStatusOv((s) => {
          const n = { ...s };
          delete n[row.id];
          return n;
        });
        toast({ title: "Failed", description: res.error, variant: "error" });
      }
    });
  }

  function changePlan(row: AdminHallRow, planId: string) {
    setPlanOv((s) => ({ ...s, [row.id]: planId }));
    startTransition(async () => {
      const res = await setHallPlan(row.id, planId);
      if (res.ok) {
        toast({ title: res.message ?? "Plan updated", variant: "success" });
        router.refresh();
      } else {
        setPlanOv((s) => {
          const n = { ...s };
          delete n[row.id];
          return n;
        });
        toast({ title: "Failed", description: res.error, variant: "error" });
      }
    });
  }

  if (halls.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No venues yet" description="Venue owners register from the public site and appear here for approval." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              <th className="px-5 py-3">Venue</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Site</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((row) => {
              const status = statusOv[row.id] ?? row.status;
              const meta = HALL_STATUS_META[status] ?? HALL_STATUS_META.PENDING;
              const planId = planOv[row.id] ?? row.planId ?? "";
              return (
                <tr key={row.id} className="border-b border-stone-50 transition hover:bg-brand-50/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Photo src={row.image} alt={row.name} fallbackLabel={row.name.slice(0, 2)} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-stone-800">{row.name}</p>
                        <p className="flex items-center gap-1 text-xs text-stone-400">
                          <MapPin className="h-3 w-3" /> {row.city} · {row.capacity.toLocaleString("en-IN")} guests
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-stone-700">{row.ownerName}</p>
                    <p className="text-xs text-stone-400">{row.ownerEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="relative inline-flex">
                      <select
                        value={planId}
                        onChange={(e) => changePlan(row, e.target.value)}
                        className="appearance-none rounded-lg bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-stone-700 ring-1 ring-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
                        aria-label={`Plan for ${row.name}`}
                      >
                        <option value="">No plan</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="relative inline-flex">
                      <select
                        value={status}
                        onChange={(e) => changeStatus(row, e.target.value)}
                        className={cn("appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-300", meta.badge)}
                        aria-label={`Status for ${row.name}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500">{formatDate(row.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/halls/${row.slug}`}
                      target="_blank"
                      className="inline-flex rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-brand-700"
                      title="View public page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
