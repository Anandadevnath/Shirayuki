"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** A popover trigger whose panel is a grid of NAVIGATION links, each drawn
 *  with a checkbox affordance to match the reference filter bar.
 *
 *  Used for the discovery bar's Genre control: the upstream has no
 *  genre-filter parameter, but it does serve real per-genre listing pages at
 *  `/genre/<slug>`, so each row genuinely navigates rather than filtering in
 *  place. The box is a visual cue; the row is a real `<Link>`.
 */
export interface FilterLinkProps {
  /** Trigger label, e.g. "Genre". */
  label: string;
  options: { slug: string; name: string }[];
  /** Base path the slug is appended to; defaults to "/genre". */
  basePath?: string;
  className?: string;
}

export function FilterLink({
  label,
  options,
  basePath = "/genre",
  className,
}: FilterLinkProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-btn)] border px-3.5 text-sm transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
          open
            ? "border-frost/50 bg-base/40 text-snow"
            : "border-line bg-base/40 text-snow hover:border-frost/40",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-faint transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label={label}
          className="glass absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[22rem] w-[min(38rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-md)] border border-line p-2 shadow-[var(--shadow-frost)] scroll-frost"
        >
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4">
            {options.map((o) => (
              <Link
                key={o.slug}
                href={`${basePath}/${o.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-snow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
              >
                <span
                  aria-hidden
                  className="grid size-[1.05rem] shrink-0 place-items-center rounded-[0.3rem] border border-line bg-base/60 transition-colors group-hover:border-coral/60"
                >
                  <Check
                    className="size-3 text-coral opacity-0 transition-opacity group-hover:opacity-100"
                    strokeWidth={3}
                  />
                </span>
                <span className="truncate">{o.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
