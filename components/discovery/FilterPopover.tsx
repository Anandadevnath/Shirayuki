"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** One option in a popover panel. */
export interface FilterOption {
  value: string;
  label: string;
  /** Render the row dimmed and unselectable. Used for options the loaded data
   *  cannot honour (e.g. a sort that needs catalogue-wide fields), so the menu
   *  matches the reference without offering a silent no-op. */
  disabled?: boolean;
  hint?: string;
}

/** Shared dark popover trigger + panel used by the discovery filter bar.
 *
 *  Two shapes are supported by one component so the toolbar can mirror the
 *  reference design (checkbox multi-select for Type, radio dots for the sort):
 *  - `multiple` → real `<input type="checkbox">` items, `onChange` toggles a
 *    value in/out of the current selection.
 *  - single → real `<input type="radio">` items, `onChange` sets the value.
 *
 *  Honesty rules baked in: the trigger label reflects the actual selection
 *  ("Type", "TV", "2 types"), and the accent (frost) only lights up when the
 *  facet is genuinely filtering. No option is ever rendered that the caller
 *  cannot honour — the caller supplies the real option list.
 */
export interface FilterPopoverProps {
  /** Accessible base name of the facet, e.g. "Type". */
  label: string;
  options: FilterOption[];
  /** selected values (one for single-select) */
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  /** panel layout — a plain list or a 3/4-column grid (genre-style) */
  columns?: 1 | 2 | 3 | 4;
  /** include an "All" row (multi only). It is highlighted, and checked,
   *  exactly when the selection is empty — i.e. "all" means "no restriction",
   *  so only pass this when an empty selection genuinely means "everything". */
  allLabel?: string;
  /** The value(s) that mean "nothing filtered" for the accent. The trigger is
   *  accent-tinted only when `value` differs from this. Defaults to `[]`, so a
   *  single-select whose default is a real option (e.g. sort = "default")
   *  passes `restingValue={["default"]}` and stays neutral at rest. */
  restingValue?: string[];
  /** Render the trigger dimmed and non-interactive. Used for a facet the
   *  upstream cannot honour, so the bar keeps its silhouette without offering
   *  a control that pretends to filter. */
  disabled?: boolean;
  /** Tooltip explaining a disabled trigger. */
  hint?: string;
  className?: string;
}

function summarize(
  label: string,
  options: FilterOption[],
  value: string[],
  multiple: boolean,
): string {
  if (value.length === 0) return label;
  const labels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);
  if (labels.length === 0) return label;
  if (!multiple) return labels[0];
  if (labels.length === 1) return labels[0];
  return `${labels.length} selected`;
}

export function FilterPopover({
  label,
  options,
  value,
  onChange,
  multiple = false,
  columns = 1,
  allLabel,
  restingValue = [],
  disabled = false,
  hint,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const resting =
    value.length === restingValue.length &&
    value.every((v) => restingValue.includes(v));
  const active = !resting;
  const selected = new Set(value);

  // Close on outside pointer / Esc, returning focus to the trigger. A single
  // document listener while open keeps the component free of portals (the
  // panel is absolutely positioned within the trigger's relative wrapper).
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

  const toggle = (v: string) => {
    if (!multiple) {
      onChange([v]);
      setOpen(false);
      return;
    }
    if (selected.has(v)) onChange(value.filter((s) => s !== v));
    else onChange([...value, v]);
  };

  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-2"
        : columns === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={disabled ? hint : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-btn)] border px-3.5 text-sm transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
          disabled
            ? "cursor-not-allowed border-line/60 bg-base/30 text-faint/70"
            : active
              ? "border-frost/50 bg-frost-soft text-frost"
              : "border-line bg-base/40 text-snow hover:border-frost/40",
        )}
      >
        <span className="truncate">
          {summarize(label, options, value, multiple)}
        </span>
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
          aria-multiselectable={multiple || undefined}
          aria-label={label}
          className="glass absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[22rem] min-w-full overflow-y-auto rounded-[var(--radius-md)] border border-line p-2 shadow-[var(--shadow-frost)] scroll-frost"
        >
          <div className={cn("grid gap-0.5", gridClass)}>
            {multiple && allLabel && (
              <label
                className={cn(
                  "col-span-full flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm transition-colors",
                  value.length === 0 ? "bg-coral/15 text-snow" : "text-muted hover:bg-surface-2 hover:text-snow",
                )}
              >
                <input
                  type="checkbox"
                  checked={value.length === 0}
                  onChange={() => onChange([])}
                  className="peer sr-only"
                />
                <Box checked={value.length === 0} round={false} />
                {allLabel}
              </label>
            )}
            {options.map((o) => {
              const isOn = selected.has(o.value);
              if (o.disabled) {
                return (
                  <span
                    key={o.value}
                    title={o.hint}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm text-faint/60"
                  >
                    <Box checked={false} round={!multiple} muted />
                    <span className="truncate">{o.label}</span>
                  </span>
                );
              }
              return (
                <label
                  key={o.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-sm transition-colors",
                    isOn
                      ? "bg-coral/15 text-snow"
                      : "text-muted hover:bg-surface-2 hover:text-snow",
                  )}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={multiple ? undefined : panelId}
                    checked={isOn}
                    onChange={() => toggle(o.value)}
                    className="peer sr-only"
                  />
                  <Box checked={isOn} round={!multiple} />
                  <span className="truncate">{o.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** The custom check/radio indicator drawn over the visually-hidden input. */
function Box({
  checked,
  round,
  muted = false,
}: {
  checked: boolean;
  round: boolean;
  muted?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[1.05rem] shrink-0 place-items-center border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-frost",
        round ? "rounded-full" : "rounded-[0.3rem]",
        muted
          ? "border-line/50 bg-base/40 text-transparent"
          : checked
            ? "border-coral bg-coral text-base"
            : "border-line bg-base/60 text-transparent",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
