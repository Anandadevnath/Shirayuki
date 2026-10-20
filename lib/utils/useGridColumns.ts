"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live column count of a CSS grid, measured from its computed
 * `grid-template-columns`. Returns `fallback` on the server and first client
 * render (so SSR/FCR markup is stable), then the real count after mount and on
 * every resize — the value tracks the responsive column changes Tailwind's
 * breakpoint classes produce, without duplicating those breakpoints in JS.
 *
 * Measuring the resolved track list (rather than re-declaring the 2/3/4/5/6
 * breakpoint table) is what keeps <RankedGrid>'s initial "rows" exact: if the
 * grid wraps to N columns, the caller can compute a whole-row slice (N × rows)
 * so a collapsed view never shows a partially cut-off row.
 */
export function useGridColumns(fallback = 2): {
  ref: React.RefObject<HTMLDivElement | null>;
  columns: number;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const tracks = getComputedStyle(el).gridTemplateColumns;
      // A resolved track list is space-separated pixel/`fr` values; an empty
      // or `none` value means the grid has not laid out yet → keep the fallback.
      const count = tracks && tracks !== "none" ? tracks.split(" ").filter(Boolean).length : 0;
      if (count > 0) setColumns(count);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, columns };
}
