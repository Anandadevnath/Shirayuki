"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Grid ↔ List switch. Two `aria-pressed` buttons in a labelled group so a
 *  screen reader announces the active view; the border/bg swap mirrors the
 *  site's active-chip treatment (Pagination / AlphabetNav). */
export function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}) {
  const base =
    "grid h-10 w-10 place-items-center rounded-[var(--radius-btn)] border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost";

  return (
    <div
      role="group"
      aria-label="Result layout"
      className="flex shrink-0 items-center gap-1"
    >
      <button
        type="button"
        aria-pressed={view === "grid"}
        aria-label="Grid view"
        onClick={() => onChange("grid")}
        className={cn(
          base,
          view === "grid"
            ? "border-frost/50 bg-frost-soft text-frost"
            : "border-line bg-base/40 text-muted hover:border-frost/40 hover:text-frost",
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        aria-pressed={view === "list"}
        aria-label="List view"
        onClick={() => onChange("list")}
        className={cn(
          base,
          view === "list"
            ? "border-frost/50 bg-frost-soft text-frost"
            : "border-line bg-base/40 text-muted hover:border-frost/40 hover:text-frost",
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
