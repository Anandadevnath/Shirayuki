"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils/cn";

/** Reference width the scaleX ratio is computed against. */
const BAR_BASE_WIDTH = 44;

/**
 * Animated tab indicator — a single frost underline that GLIDES between
 * tabs (measured from the active button's box) instead of the previous
 * per-tab scale-x underline, which could only fade in place, never
 * travel. Used by Top 10 (and reused wherever a text-tab row exists).
 *
 * API: a hook that binds refs onto the existing tab track + buttons, so
 * the real, accessible buttons are measured (never hidden dummies).
 *
 *   const { bindTrack, bindBtn, barStyle } = useTabIndicator(activeKey);
 *   <div ref={bindTrack} className="relative flex gap-4">
 *     {tabs.map(t => <button ref={bindBtn(t.key)} …>{t.label}</button>)}
 *     <span className="…" style={barStyle} aria-hidden />
 *   </div>
 *
 * SSR-safe: `barStyle` is null until the first measurement, so the
 * server HTML matches the previous per-tab underline rendering (no bar)
 * and the bar fades in on hydration with no layout shift. Re-measures
 * on resize (ResizeObserver on the track) and after webfonts settle.
 * The bar glides via the `.tab-indicator` transition (left/width of the
 * 2px bar only — no other layout is touched).
 */
export function useTabIndicator(activeKey: string) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef(new Map<string, HTMLElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const btn = btnRefs.current.get(activeKey);
    if (!track || !btn) return;
    const tr = track.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    if (br.width === 0 || tr.width === 0) return;
    const left = br.left - tr.left;
    setBar((prev) =>
      prev && Math.abs(prev.left - left) < 0.5 && Math.abs(prev.width - br.width) < 0.5
        ? prev // avoid re-render churn on sub-pixel noise
        : { left, width: br.width },
    );
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();
    // Labels can settle slightly wider once webfonts load — re-measure.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
  }, [measure]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  const bindTrack = useCallback((el: HTMLDivElement | null) => {
    trackRef.current = el;
  }, []);

  const bindBtn = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) btnRefs.current.set(id, el);
      else btnRefs.current.delete(id);
    },
    [],
  );

  const barStyle: CSSProperties | undefined = bar
    ? ({
        transform: `translateX(${bar.left}px) scaleX(${bar.width / BAR_BASE_WIDTH})`,
      } as CSSProperties)
    : undefined;

  return { bindTrack, bindBtn, barStyle };
}

/**
 * The rendered underline. Absolutely positioned inside the tab track;
 * invisible until the first measurement so SSR markup is unchanged.
 *
 * The glide is transform-only: the bar keeps a fixed base width and
 * translateX positions it while scaleX stretches it to each tab —
 * compositor-animated, so the swap-jank of incoming panel content can
 * never stutter it (transitioning `left`/`width` would re-layout every
 * frame). scaleX on a 2px pill distorts its caps imperceptibly.
 */
export function TabBar({
  barStyle,
  className,
}: {
  barStyle: CSSProperties | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "tab-indicator pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-frost",
        className,
      )}
      style={{ width: BAR_BASE_WIDTH, ...barStyle }}
    />
  );
}
