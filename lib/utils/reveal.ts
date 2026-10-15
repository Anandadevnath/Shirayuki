import type { CSSProperties } from "react";

/**
 * Shared stagger-reveal style — sets `--reveal-delay` for the `.reveal` /
 * `.reveal-fade` (and `.title-rise`) CSS classes in a typed way, removing the
 * `["--reveal-delay" as string]` cast that every grid/rail repeats.
 *
 * Pure function; no `"use client"` so server AND client components can import
 * it. Pass a raw ms value — cascades compute `index * step` themselves so the
 * cap (e.g. `Math.min(i, 9)`) stays explicit at the call site.
 */
export const revealDelay = (ms: number): CSSProperties =>
  ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;
