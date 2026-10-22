"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Styled native `<select>`. A real `<select>` (not a custom listbox) keeps
 *  keyboard + screen-reader behaviour free and gives a no-JS fallback — the
 *  chevron is a non-interactive overlay so the control stays one focusable
 *  element. `label` renders visually-hidden so every control is named without
 *  cluttering the compact toolbar row. */
export function ToolbarSelect({
  id,
  label,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  /** accessible name; rendered as a visually-hidden `<label>` */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-[var(--radius-btn)] border border-line bg-base/40 pl-3 pr-9 text-sm text-snow outline-none transition-colors duration-200 hover:border-frost/40 focus-visible:border-frost/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost [&>option]:bg-base [&>option]:text-snow"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-faint"
      />
    </div>
  );
}
