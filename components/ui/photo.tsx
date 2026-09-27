"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Image with graceful gradient fallback (remote images may be blocked offline). */
export function Photo({
  src,
  alt,
  className,
  fallbackLabel,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-brand-100 via-cream-200 to-gold-100",
          className
        )}
        aria-label={alt}
      >
        {fallbackLabel ? (
          <span className="px-4 text-center font-display text-lg font-semibold tracking-wide text-brand-800/70">
            {fallbackLabel}
          </span>
        ) : (
          <Sparkles className="h-6 w-6 text-brand-400" />
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
