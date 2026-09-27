"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { setSubscriptionStatus } from "@/lib/actions/admin";
import { SUB_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const OPTIONS = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"];

export function SubscriptionStatusSelect({ hallId, status }: { hallId: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(status);
  const [, startTransition] = useTransition();
  const meta = SUB_STATUS_META[value] ?? SUB_STATUS_META.TRIALING;

  function change(next: string) {
    setValue(next); // optimistic
    startTransition(async () => {
      const res = await setSubscriptionStatus(hallId, next);
      if (res.ok) {
        toast({ title: res.message ?? "Updated", variant: "success" });
        router.refresh();
      } else {
        setValue(status);
        toast({ title: "Failed", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        className={cn("appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-300", meta.badge)}
        aria-label="Subscription status"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {SUB_STATUS_META[o]?.label ?? o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
    </div>
  );
}
