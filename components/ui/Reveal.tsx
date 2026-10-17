"use client";

import { useEffect, useRef } from "react";
import { observeReveal, markShown } from "@/lib/utils/reveal-observer";

/**
 * Scroll-reveal wrapper — the client half of the viewport-reveal system
 * (see lib/utils/reveal-observer.ts and the "Viewport reveals" block in
 * app/globals.css).
 *
 * Server components use this freely: the wrapper is a ~40-line client
 * island and the children stay server-rendered, so rails/grids keep
 * their data-fetching model untouched.
 *
 * Behaviour:
 *  - Renders `<div data-reveal>` — BEFORE hydration, the CSS hides it
 *    only when the inline layout script has marked the document as
 *    JS-capable (`html[data-anim="1"]`), so nothing can ever get stuck
 *    invisible for users without JS (plus <noscript> and reduced-motion
 *    overrides as further rails).
 *  - A shared singleton IntersectionObserver adds `data-shown` the
 *    first time the element enters the viewport → the CSS entrance runs
 *    once (with the `--reveal-delay` stagger), never replaying on small
 *    scrolls.
 *  - `prefers-reduced-motion`: the element is marked shown immediately
 *    and the CSS provides a force-visible guard, so content never waits
 *    on an animation that will not play.
 */

export function Reveal({
  children,
  delay = 0,
  /**
   * "rise" (default) — 14px vertical settle with a touch of scale, the
   * platform's standard section entrance.
   * "fade" — opacity only, for dense lists where 20 rising wrappers
   * would read as busy.
   */
  variant = "rise",
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: "rise" | "fade";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markShown(el);
      return;
    }
    return observeReveal(el);
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={variant === "fade" ? "fade" : ""}
      className={className}
      style={
        {
          ...style,
          ...(delay > 0 ? { "--reveal-delay": `${delay}ms` } : null),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
