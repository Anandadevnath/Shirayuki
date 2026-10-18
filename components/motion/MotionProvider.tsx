"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { DEFAULT_TRANSITION } from "@/lib/motion/tokens";

/**
 * Global Motion configuration. Renders no DOM — it only provides context and
 * the default transition that the rest of the tree inherits, so wrapping the
 * layout costs nothing structurally and cannot affect the RSC payload (the
 * children are still passed through from the server component).
 *
 * `reducedMotion="user"` is the important part: it makes Motion honour
 * `prefers-reduced-motion: reduce` by dropping transform and layout
 * animations while keeping opacity fades. The CSS catch-all in globals.css
 * (`* { animation-duration: 0.001ms !important }`) cannot reach Motion, whose
 * animations are driven from JS — this is the Motion-side equivalent.
 *
 * Wrapped around the app in `app/layout.tsx`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={DEFAULT_TRANSITION}>
      {children}
    </MotionConfig>
  );
}
