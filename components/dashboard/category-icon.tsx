import {
  Camera,
  Car,
  Flower2,
  Landmark,
  Lightbulb,
  Music,
  PartyPopper,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AddonCategory } from "@/lib/schema";

const ICONS: Record<string, LucideIcon> = {
  DECOR: Flower2,
  LIGHTING: Lightbulb,
  SOUND: Music,
  STAGE: Landmark,
  FURNITURE: Sofa,
  PHOTOGRAPHY: Camera,
  VEHICLE: Car,
  ENTERTAINMENT: PartyPopper,
  OTHER: Sparkles,
};

const TONES: Record<string, string> = {
  DECOR: "bg-rose-50 text-rose-500 ring-rose-100",
  LIGHTING: "bg-amber-50 text-amber-500 ring-amber-100",
  SOUND: "bg-violet-50 text-violet-500 ring-violet-100",
  STAGE: "bg-brand-50 text-brand-500 ring-brand-100",
  FURNITURE: "bg-stone-100 text-stone-500 ring-stone-200",
  PHOTOGRAPHY: "bg-sky-50 text-sky-500 ring-sky-100",
  VEHICLE: "bg-indigo-50 text-indigo-500 ring-indigo-100",
  ENTERTAINMENT: "bg-gold-50 text-gold-600 ring-gold-200",
  OTHER: "bg-emerald-50 text-emerald-500 ring-emerald-100",
};

export function AddonCategoryIcon({ category, className }: { category: AddonCategory | string; className?: string }) {
  const Icon = ICONS[category] ?? Sparkles;
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[category] ?? TONES.OTHER} ${className ?? ""}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
