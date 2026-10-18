"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SCALE, SPRING } from "@/lib/motion/tokens";

/**
 * Next `<Link>` with spring hover/press feedback.
 *
 * `motion.create()` keeps every Link prop (href, prefetch, replace, scroll)
 * and the router's own click handling — only the transform is animated, and
 * only two properties of it: a small hover lift/scale and a press-down on
 * pointer-down. That is the tactile half of the `.press` CSS class in
 * globals.css, upgraded from a fixed 180ms curve to an interruptible spring.
 *
 * Use this for *primary* actions (hero CTAs, "Watch now", panel actions).
 * Secondary controls keep the cheaper CSS `.press` — a page with forty
 * springs is measurable, a page with two is not.
 */
export const TapLink = motion.create(Link);

/** The presets, so call sites stay declarative and identical. */
export const pressProps = {
  whileHover: { scale: SCALE.hover, transition: SPRING.lift },
  whileTap: { scale: SCALE.press, transition: SPRING.snap },
} as const;

/** Same treatment for a plain `<button>`. */
export const TapButton = motion.button;
