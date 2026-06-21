"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";

// Marquee drift speed, px/s. The rail glides right-to-left so it reads as a
// "train" of posters — deliberately the opposite direction to Latest Episodes.
const SPEED = 34;

/** Read the live translateX of an element — works mid-animation, where the
 *  computed `transform` is an interpolated matrix. Used to freeze the marquee
 *  exactly where it is the instant an arrow is pressed. */
function readTranslateX(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  try {
    return new DOMMatrixReadOnly(t).m41;
  } catch {
    return 0;
  }
}

/** One ranked landscape card. Pulled out so the marquee and the reduced-motion
 *  fallback rail can share the exact same markup. */
function TrendCard({
  s,
  rank,
  ariaHidden = false,
}: {
  s: AnimeCardModel;
  rank: number;
  ariaHidden?: boolean;
}) {
  const top3 = rank <= 3;
  return (
    <Link
      href={`/anime/${s.id}`}
      aria-label={s.title}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className="group relative aspect-[3/2] w-44 shrink-0 transform-gpu transition-transform duration-300 hover:-translate-y-1 sm:w-52 md:w-56"
    >
      {/* Frost lift shadow — opacity-crossfaded sibling on the unclipped outer
          wrapper, never a transitioned box-shadow (which would repaint the
          card body every hover frame). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[var(--shadow-frost)] transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Clipped frame — the ring crossfades frost on hover via a sibling
          overlay (ring on the frame stays static, no box-shadow repaint). */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl ring-1",
          top3 ? "ring-frost/40" : "ring-line",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            top3 ? "ring-frost" : "ring-frost/60",
          )}
        />

        {s.poster && (
          <SmartImage
            src={s.poster}
            alt=""
            fill
            sizes="224px"
            className="object-cover brightness-[0.88]"
          />
        )}

        {/* Scrim — deep at the bottom to seat the chart number + title */}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/35 to-transparent" />

        {/* Frost wash on hover — tints the art instead of a slow `filter`
            transition on the poster. */}
        <div className="absolute inset-0 bg-frost-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Hover play affordance */}
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-11 scale-75 place-items-center rounded-full bg-frost/90 text-base shadow-[var(--shadow-neon)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
            <Play className="size-5 fill-current" />
          </span>
        </span>

        {/* Oversized chart rank + title, baseline-aligned */}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-2.5">
          <span
            className={cn(
              "font-display text-4xl font-extrabold leading-[0.78] tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.8)] sm:text-5xl",
              top3 ? "text-frost" : "text-snow",
            )}
            style={{
              WebkitTextStroke: top3
                ? "1.5px var(--color-frost)"
                : "1px rgba(255,255,255,0.55)",
            }}
          >
            {rank}
          </span>
          <span className="line-clamp-2 pb-0.5 text-left text-[12px] font-semibold leading-tight text-snow [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
            {s.title}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Trending rail — ranked landscape cards with oversized chart numbers. The rail
 * auto-drifts as an endless right-to-left marquee (a doubled track wrapped at
 * its half-width) and freezes the instant a pointer or touch lands on it.
 * Reduced-motion users get the original arrow-driven scroll rail instead.
 */
export function Trending({ items }: { items: AnimeCardModel[] }) {
  const reduce = useReducedMotionSSR();
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  // Current eased offset of the manually-nudged marquee (px, ≤ 0) and the timer
  // that hands control back to the auto-drift once the user stops clicking.
  const offsetRef = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Active flick-inertia rAF (null when idle). Held in a ref so both the touch
  // handler and the arrow nudge can cancel an in-flight glide before taking over.
  const momentumRef = useRef<number | null>(null);

  // Continuous leftward drift, wrapped seamlessly at half the doubled track.
  // The animation runs as a pure CSS keyframe (off the main thread) and pauses
  // via a `:hover` rule on the container — see `.trend-marquee` in globals.css.
  // We measure the half-width here only so reduced-motion / paused branches
  // can fall back to a JS-driven offset if needed.
  useEffect(() => {
    if (reduce) return;
    const el = trackRef.current;
    if (!el) return;
    // Pre-compute the animation duration from the half-width so the linear
    // marquee speed matches the previous JS implementation (SPEED px/s). We
    // measure once on mount + on resize; if the track is empty the duration
    // is 0 and the CSS animation just doesn't move.
    const measure = () => {
      const half = el.scrollWidth / 2;
      const seconds = half > 0 ? half / SPEED : 0;
      el.style.setProperty("--trend-duration", `${seconds}s`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduce]);

  // Reduced-motion fallback: manual scroll by ~a viewport-worth.
  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  // Hand the marquee back to its endless CSS drift, picking up exactly where the
  // manual nudge left off: a negative `animation-delay` of offset/SPEED seeks
  // the keyframe (0 → −half over half/SPEED s) to the matching frame.
  const resumeDrift = () => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "";
    el.style.animation = "";
    el.style.animationDelay = `${offsetRef.current / SPEED}s`;
    // Clear (don't force "running"): an inline play-state would override the
    // `.trend-marquee-wrap:hover` pause rule in globals.css, so hovering would
    // stop pausing the rail after the first interaction. Cleared, the class's
    // default running state applies and CSS hover/focus pause works again.
    el.style.animationPlayState = "";
  };

  // Touch-drag: let the rail follow the finger on mobile. The marquee is a
  // transform animation inside an overflow-hidden box (not a native scroller),
  // so we drive `transform` directly. We attach the listeners natively because
  // the horizontal-drag branch must `preventDefault()` to stop the page from
  // scrolling — React's onTouchMove is passive and can't. `touch-action: pan-y`
  // on the wrapper tells the browser vertical pans are still its job, so a
  // vertical swipe scrolls the page normally and only horizontal swipes grab
  // the rail. On release we re-hand control to the CSS drift after a short idle.
  useEffect(() => {
    if (reduce) return;
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    let active = false; // a touch is down (onStart fired, onEnd hasn't)
    let dragging = false; // gesture resolved as a horizontal drag
    let decided = false; // axis lock (horizontal vs vertical) settled
    let startX = 0;
    let startY = 0;
    let startOffset = 0;
    let half = 0;
    // Velocity tracking for the release fling, in px/ms (sign = drag direction).
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    // Ambient drift velocity (leftward) the CSS keyframe runs at, in px/ms. The
    // fling decays toward this — not toward zero — so inertia melts straight
    // into the marquee with no perceptible stop-and-restart.
    const DRIFT_V = -SPEED / 1000;

    // Normalise any translateX into (−half, 0] so both copies of the doubled
    // track stay full — drag as far as you like, the rail never shows a gap.
    const norm = (x: number) => (half <= 0 ? x : (((x % half) + half) % half) - half);

    const stopMomentum = () => {
      if (momentumRef.current !== null) {
        cancelAnimationFrame(momentumRef.current);
        momentumRef.current = null;
      }
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      stopMomentum();
      half = track.scrollWidth / 2;
      if (idleRef.current) clearTimeout(idleRef.current);
      active = true;
      dragging = false;
      decided = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startOffset = norm(readTranslateX(track));
      offsetRef.current = startOffset;
      lastX = startX;
      lastT = performance.now();
      velocity = 0;
      track.style.animation = "none";
      track.style.transition = "none";
      track.style.transform = `translate3d(${startOffset}px, 0, 0)`;
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const x = e.touches[0].clientX;
      const dx = x - startX;
      const dy = e.touches[0].clientY - startY;
      if (!decided) {
        // Wait for a few px of travel before committing to an axis, so a tap
        // (to open a card) or a vertical scroll isn't hijacked.
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        dragging = Math.abs(dx) > Math.abs(dy);
      }
      if (!dragging) return; // vertical → let the page scroll
      e.preventDefault();
      // Exponentially-smoothed pointer velocity, so one jittery sample doesn't
      // throw the fling off.
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) {
        velocity = velocity * 0.7 + ((x - lastX) / dt) * 0.3;
        lastX = x;
        lastT = now;
      }
      const offset = norm(startOffset + dx);
      offsetRef.current = offset;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      if (!dragging) {
        // Tap / vertical swipe that never moved the rail → resume drift shortly.
        if (idleRef.current) clearTimeout(idleRef.current);
        idleRef.current = setTimeout(resumeDrift, 500);
        return;
      }
      // Flick inertia: a short, firmly-damped coast that eases the release
      // velocity toward the ambient drift, then hands the exact position back to
      // the CSS keyframe. Tuned for a controlled, "professional" deceleration
      // (~250ms) rather than a long floaty glide:
      //   FRICTION  — per-ms decay; lower = snappier stop.
      //   MAX_V     — clamp so a hard flick can't launch the rail across itself.
      //   SETTLE    — velocity gap at which we stop and hand back to drift.
      const FRICTION = 0.98;
      const MAX_V = 2.2;
      const SETTLE = 0.01;
      let v = Math.max(-MAX_V, Math.min(MAX_V, velocity));
      let prev = performance.now();
      const step = (now: number) => {
        const dt = Math.min(now - prev, 32); // clamp stalls (tab blur, GC)
        prev = now;
        v = DRIFT_V + (v - DRIFT_V) * Math.pow(FRICTION, dt);
        offsetRef.current = norm(offsetRef.current + v * dt);
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        if (Math.abs(v - DRIFT_V) > SETTLE) {
          momentumRef.current = requestAnimationFrame(step);
        } else {
          momentumRef.current = null;
          resumeDrift();
        }
      };
      momentumRef.current = requestAnimationFrame(step);
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd);
    wrap.addEventListener("touchcancel", onEnd);
    return () => {
      stopMomentum();
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [reduce]);

  // Arrow-driven nudge for the live marquee. Freezes the drift at its current
  // position, then eases one viewport-worth in `dir`. The track is doubled, so
  // we normalise into a single content-set and shift by whole sets (invisible)
  // to keep both edges full — no blank rails however far you click.
  const nudgeMarquee = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Cancel any in-flight touch-fling so it doesn't fight the arrow transform.
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
    const half = el.scrollWidth / 2;
    const view = el.parentElement?.clientWidth ?? 0;
    if (half <= 0 || view <= 0) return;

    let from = ((readTranslateX(el) % half) + half) % half - half; // (−half, 0]
    let to = from - dir * view * 0.85;
    while (to > 0) { from -= half; to -= half; }
    while (to < -half) { from += half; to += half; }

    if (idleRef.current) clearTimeout(idleRef.current);

    // Take over from the CSS keyframe with an eased manual transform.
    el.style.animation = "none";
    el.style.transition = "none";
    el.style.transform = `translate3d(${from}px, 0, 0)`;
    void el.offsetWidth; // commit the start frame before transitioning
    requestAnimationFrame(() => {
      el.style.transition = "transform 650ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      el.style.transform = `translate3d(${to}px, 0, 0)`;
    });
    offsetRef.current = to;
    idleRef.current = setTimeout(resumeDrift, 2600);
  };

  const onArrow = (dir: 1 | -1) =>
    reduce ? scrollRail(dir) : nudgeMarquee(dir);

  // Drop the resume timer / in-flight fling if we unmount mid-interaction.
  useEffect(() => () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    if (momentumRef.current !== null) cancelAnimationFrame(momentumRef.current);
  }, []);

  if (!items?.length) return null;

  const rankOf = (s: AnimeCardModel, i: number) =>
    typeof s.rank === "number" ? s.rank : i + 1;

  return (
    <section className="relative">
      {/* Editorial header — frost accent bar + stacked eyebrow/title, with
          scroll arrows on the right (reduced-motion only). */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-frost to-frost-deep shadow-[var(--shadow-neon)]" />
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-frost">
              <span aria-hidden className="inline-flex">
                <Flame className="size-3.5 fill-frost/25" />
              </span>
              Hot right now
            </span>
            <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              Trending
            </h2>
          </div>
        </div>

        {/* Manual nudge arrows — frost-glass back / frost-filled forward, the
            same pairing the rest of the site uses. They drive the live marquee
            (or the reduced-motion rail) by ~a viewport per press. */}
        <div className="ml-auto flex shrink-0 gap-1.5">
          <button
            onClick={() => onArrow(-1)}
            aria-label="Scroll trending left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-[color,border-color,transform] duration-200 hover:border-frost/40 hover:text-snow active:scale-90"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => onArrow(1)}
            aria-label="Scroll trending right"
            className="grid size-8 place-items-center rounded-full bg-frost text-base shadow-[var(--shadow-neon)] transition-transform duration-200 hover:scale-105 active:scale-90"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {reduce ? (
        // Static, manually scrollable rail for reduced-motion users.
        <div ref={railRef} className="no-scrollbar flex gap-3.5 overflow-x-auto px-0.5 pb-4 pt-3">
          {items.map((s, idx) => (
            <TrendCard key={`${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} />
          ))}
        </div>
      ) : (
        // Auto-drifting marquee — pauses on any pointer/touch interaction.
        // The CSS keyframe animation runs entirely off the main thread; the
        // :hover pause + JS touch-pause give the user full control. The
        // container itself is masked on the left/right edges so cards
        // physically fade into transparency at the rails.
        <div
          ref={wrapRef}
          className="trend-marquee-wrap group/marquee relative overflow-hidden"
          style={{
            // `pan-y`: vertical swipes scroll the page, horizontal swipes are
            // captured by the touch-drag handler (see the touch effect above).
            touchAction: "pan-y",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 120px, black calc(100% - 120px), transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0, black 120px, black calc(100% - 120px), transparent 100%)",
          }}
        >
          <div
            ref={trackRef}
            className="trend-marquee flex w-max gap-3.5 px-0.5 pb-4 pt-3"
          >
            {/* Doubled track: the second copy is decorative (hidden from a11y).
                Both copies stay mounted so the seamless loop anchor exists,
                but every SmartImage below is rendered with `loading="lazy"`
                (the next/image default). The decorative copy starts ~50%
                off-screen left — modern browsers only fetch its posters as
                they translate into the viewport, so the LCP/INP path never
                pays for them upfront. */}
            {items.map((s, idx) => (
              <TrendCard key={`a-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} />
            ))}
            {items.map((s, idx) => (
              <TrendCard key={`b-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} ariaHidden />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}