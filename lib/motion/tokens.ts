import type { Transition, Variants } from "motion/react";

/**
 * ── The motion system ──────────────────────────────────────────────────────
 *
 * One place for every duration, curve, spring, stagger and offset used by the
 * Motion-for-React surfaces in `components/motion`. Components import from here
 * instead of hand-picking numbers, so the whole site shares one cadence the way
 * `app/globals.css` shares one type scale.
 *
 * Relationship to the existing CSS animation system
 * ─────────────────────────────────────────────────
 * The app already animates a lot in CSS (keyframes + the `[data-reveal]`
 * viewport observer in `lib/utils/reveal-observer.ts`). That system is kept —
 * it is declarative, runs off the main thread for transforms, costs no JS per
 * frame, and already covers entrance choreography, shimmer, marquees and
 * ambient drift. This module is NOT a second reveal system: Motion is used
 * only where CSS is awkward or impossible —
 *
 *   · pointer-driven motion (tilt, parallax, specular sheen on the cards)
 *   · spring physics (taps, panels, layout transitions)
 *   · exit animations (AnimatePresence — CSS can only animate on mount)
 *   · scroll-linked transforms that must be read back per frame
 *
 * The curves and durations below are deliberately the SAME numbers the CSS
 * keyframes use (`cubic-bezier(0.16, 1, 0.3, 1)` is the house curve), so the
 * two systems read as one.
 *
 * Reduced motion is handled globally by `MotionProvider` (`MotionConfig
 * reducedMotion="user"`), which drops transform/layout animations for users
 * who ask for it while keeping opacity fades. That is the Motion-side
 * counterpart to the `@media (prefers-reduced-motion: reduce)` catch-all in
 * globals.css — the CSS catch-all cannot reach Motion's JS-driven animations.
 */

/** Durations in seconds (Motion's unit), named by intent, not by size. */
export const DURATION = {
  /** State flips that must feel instant (hover tints, chevrons). */
  instant: 0.08,
  /** Small UI response — taps, menu items, badge swaps. */
  fast: 0.18,
  /** Default for component transitions (panels, cards, reveals). */
  base: 0.28,
  /** Deliberate, larger surfaces (dialogs, hero copy groups). */
  slow: 0.45,
  /** One-shot cinematic settles (hero art, banners). */
  cinematic: 0.72,
} as const;

/** Easing curves. `out` is the CSS house curve used by every keyframe. */
export const EASE = {
  /** cubic-bezier(0.16, 1, 0.3, 1) — the app's standard decelerate. */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** cubic-bezier(0.4, 0, 0.2, 1) — symmetric; for routes and crossfades. */
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Gentle overshoot for small pops (badges, dots, counters). */
  pop: [0.22, 1.2, 0.36, 1] as [number, number, number, number],
} as const;

/**
 * Spring presets, named by feel. Springs are preferred over curves for
 * anything the pointer drives, because they are interruptible — a change of
 * direction mid-flight reroutes instead of restarting.
 */
export const SPRING: Record<"snap" | "lift" | "tilt" | "panel" | "soft", Transition> = {
  /** Immediate, almost no visible overshoot — taps and toggles. */
  snap: { type: "spring", stiffness: 560, damping: 38, mass: 0.6 },
  /** Card lift / press response — quick, slightly springy. */
  lift: { type: "spring", stiffness: 320, damping: 26, mass: 0.9 },
  /** Pointer tilt — softer so the card trails the cursor a touch. */
  tilt: { type: "spring", stiffness: 200, damping: 22, mass: 0.8 },
  /** Dialogs, drawers, sheets — settles with authority, no bounce. */
  panel: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  /** Ambient float — slow, barely-there. */
  soft: { type: "spring", stiffness: 90, damping: 20, mass: 1.2 },
};

/** Stagger steps in seconds between siblings in a sequence. */
export const STAGGER = {
  tight: 0.035,
  base: 0.06,
  loose: 0.09,
} as const;

/**
 * Cascade ceiling: the longest delay a list may stagger to. Long grids would
 * otherwise queue "hundreds of simultaneous animations" and read as slow, so
 * the index is capped and the tail arrives together.
 */
export const STAGGER_MAX = 6;

/** Translation distances in px, by intent. Small on purpose. */
export const OFFSET = {
  hair: 4,
  small: 8,
  base: 14,
  large: 22,
} as const;

/** Scale deltas. Anything above ~1.06 starts to read as a zoom, not a lift. */
export const SCALE = {
  press: 0.97,
  hover: 1.02,
  poster: 1.04,
} as const;

/** Default transition applied by `MotionProvider` to un-annotated tweens. */
export const DEFAULT_TRANSITION: Transition = {
  duration: DURATION.base,
  ease: EASE.out,
};

/** Delay for the nth item of a staggered sequence, capped at `STAGGER_MAX`. */
export function staggerDelay(index: number, step: number = STAGGER.base): number {
  return Math.min(index, STAGGER_MAX) * step;
}

/* ── Shared variants ──────────────────────────────────────────────────────
   Kept intentionally few: opacity + a short rise, and a container that
   cascades. Everything else composes these. */

/** Fade + rise, used for anything appearing in place (panels, rows, copy). */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: OFFSET.small },
  show: { opacity: 1, y: 0 },
};

/** Same as `riseIn` but with less travel — for dense, already-visible lists. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

/** Parent that cascades `show` down to its children. */
export function cascade(step: number = STAGGER.base): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step } },
  };
}

/** Backdrop scrim for overlays (palette, dialogs, drawers). */
export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

/** Panel for overlays: rises a little and settles from 98.5% scale. */
export const overlayPanel: Variants = {
  hidden: { opacity: 0, y: OFFSET.small, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1 },
};
