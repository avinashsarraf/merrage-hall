import Link from "next/link";
import { ArrowRight, MapPin, Star, Users, UtensilsCrossed } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { Badge } from "@/components/ui/badge";
import { cn, formatINR } from "@/lib/utils";
import type { Hall } from "@/lib/schema";

function pseudoRating(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 97;
  return (4.5 + (h % 5) / 10).toFixed(1);
}

export function HallCard({ hall, className }: { hall: Hall; className?: string }) {
  return (
    <Link
      href={`/halls/${hall.slug}`}
      className={cn(
        "group block overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-stone-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Photo
          src={hall.images[0]}
          alt={hall.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackLabel={hall.name}
        />
        <Badge className="absolute left-3 top-3 bg-white/90 text-brand-800 backdrop-blur">
          <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
          {pseudoRating(hall.slug)}
        </Badge>
        {hall.hallCount > 1 ? (
          <Badge className="absolute right-3 top-3 bg-brand-950/70 text-white backdrop-blur">
            {hall.hallCount} halls
          </Badge>
        ) : null}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-stone-900 transition-colors group-hover:text-brand-800">
          {hall.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          {hall.city}, {hall.state}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
            <Users className="mr-1 h-3 w-3" />
            {hall.capacity.toLocaleString("en-IN")} guests
          </span>
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
            <UtensilsCrossed className="mr-1 h-3 w-3" />
            {formatINR(hall.vegPlate)}/plate veg
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Venue rent from</p>
            <p className="font-display text-lg font-bold text-brand-800">
              {formatINR(hall.baseRent)}
              <span className="text-xs font-medium text-stone-400">/day</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
