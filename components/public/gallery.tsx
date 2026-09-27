"use client";

import { useState } from "react";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.filter(Boolean);

  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-soft ring-1 ring-stone-200/80">
        <Photo
          src={list[active]}
          alt={`${name} — photo ${active + 1}`}
          className="h-full w-full object-cover"
          fallbackLabel={name}
        />
        {list.length > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-brand-950/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {active + 1} / {list.length}
          </span>
        ) : null}
      </div>
      {list.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={cn(
                "overflow-hidden rounded-xl ring-2 transition-all",
                active === i ? "ring-brand-600" : "opacity-70 ring-transparent hover:opacity-100"
              )}
            >
              <Photo src={src} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
