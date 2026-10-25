"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** A popover trigger whose panel is a grid of checkbox rows.
 *
 *  Used for the discovery bar's Genre control. It is a CONTROLLED multi-select:
 *  toggling a row updates the caller's selection and KEEPS THE PANEL OPEN, so
 *  several genres can be picked; nothing here navigates or fetches. The caller
 *  (the board) applies the draft when its Filter button is pressed. The trigger
 *  summarises the selection ("Genre", "Action", or "3 genres").
 *
 *  Genre rows are real `<input type="checkbox">`s (visually hidden behind the
 *  shared checkbox affordance), matching the Type facet so the two controls
 *  cannot drift.
 */
export interface FilterLinkProps {
  /** Trigger label, e.g. "Genre". */
  label: string;
  options: { slug: string; name: string }[];
  /** selected slugs */
  value: string[];
  /** toggle handler — the component reports the full next selection */
  onChange: (value: string[]) => void;
  /** include an "All" row that clears the selection */
  allLabel?: string;
  className?: string;
}

export function FilterLink({
  label,
  options,
  value,
  onChange,
  allLabel,
  className,
}: FilterLinkProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const selected = new Set(value);
  const active = value.length > 0;
  const currentLabel = (() => {
    if (!active) return label;
    if (value.length === 1)
      return options.find((o) => o.slug === value[0])?.name ?? label;
    return `${value.length} genres`;
  })();

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

  const toggle = (slug: string) => {
    if (selected.has(slug)) onChange(value.filter((s) => s !== slug));
    else onChange([...value, slug]);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-btn)] border px-3.5 text-sm transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
          open
            ? "border-frost/50 bg-base/40 text-snow"
            : active
              ? "border-frost/50 bg-frost-soft text-frost"
              : "border-line bg-base/40 text-snow hover:border-frost/40",
        )}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            active ? "text-frost" : "text-faint",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className="glass absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[22rem] w-[min(38rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-md)] border border-line p-2 shadow-[var(--shadow-frost)] scroll-frost"
        >
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4">
            {allLabel && (
              <label
                className={cn(
                  "col-span-full flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm transition-colors",
                  value.length === 0
                    ? "bg-coral/15 text-snow"
                    : "text-muted hover:bg-surface-2 hover:text-snow",
                )}
              >
                <input
                  type="checkbox"
                  checked={value.length === 0}
                  onChange={() => onChange([])}
                  className="peer sr-only"
                />
                <Box checked={value.length === 0} />
                <span className="truncate">{allLabel}</span>
              </label>
            )}
            {options.map((o) => {
              const isOn = selected.has(o.slug);
              return (
                <label
                  key={o.slug}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm transition-colors",
                    isOn
                      ? "bg-coral/15 text-snow"
                      : "text-muted hover:bg-surface-2 hover:text-snow",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(o.slug)}
                    className="peer sr-only"
                  />
                  <Box checked={isOn} />
                  <span className="truncate">{o.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** The custom check indicator drawn over the visually-hidden checkbox. */
function Box({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[1.05rem] shrink-0 place-items-center rounded-[0.3rem] border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-frost",
        checked
          ? "border-coral bg-coral text-base"
          : "border-line bg-base/60 text-transparent",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
