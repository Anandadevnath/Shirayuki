"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Expandable synopsis text. Shared by the detail hero and the watch page's
 * CinematicInfo so the two never drift (previously each had its own copy, with
 * a different line clamp and a11y attributes). `clamp` sets the collapsed line
 * count per surface.
 */
export function ReadMore({ text, clamp = 5 }: { text: string; clamp?: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-1.5">
      <p
        className={cn("text-desc text-muted/90", expanded ? "" : "overflow-hidden")}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: clamp,
                WebkitBoxOrient: "vertical",
              }
        }
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-meta inline-flex items-center gap-1 font-semibold text-frost transition-colors hover:text-snow"
      >
        {expanded ? "Read less" : "Read more"}
        <span
          aria-hidden
          className={cn("transition-transform duration-300", expanded ? "rotate-180" : "rotate-0")}
        >
          ▾
        </span>
      </button>
    </div>
  );
}
