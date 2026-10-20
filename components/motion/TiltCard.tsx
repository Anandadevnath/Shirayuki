"use client";

import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { SCALE, SPRING } from "@/lib/motion/tokens";
import { useFinePointer } from "@/lib/utils/useMediaQuery";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/**
 * Pointer-tilt card surface — the shared "physical poster" interaction.
 *
 * Two motion values (normalised to −0.5…0.5) are driven by pointer events and
 * read back through springs, so:
 *   · nothing re-renders on pointer move — Motion writes the transform
 *     straight to the element;
 *   · leaving the card springs everything home instead of snapping;
 *   · an interrupted tilt reroutes smoothly rather than restarting.
 *
 * Gating (all of it required — a tilt that sticks or fights a finger is worse
 * than no tilt at all):
 *   · `useFinePointer()` — never on touch, where there is no hover-out;
 *   · `useReducedMotionSSR()` — off entirely for reduced-motion users;
 *   · `disabled` — callers can force it off (e.g. a static poster).
 *
 * The specular sheen is a single soft frost blob translated with the pointer
 * (transform only — never a moving `background-position`, which would repaint
 * the card every frame). It is revealed by the `.tilt-card` hover rule in
 * globals.css and clipped by the caller's frame.
 *
 * `className` is applied to the tilting element, so callers pass their frame
 * (rounded, `overflow-hidden`, ring) and it becomes the physical card.
 */
export function TiltCard({
  children,
  className,
  style,
  /** Max rotation in degrees. ~6° is the ceiling before type starts to soften. */
  maxTilt = 6,
  /** Hover scale. Kept under ~1.03 — see SCALE. */
  hoverScale = SCALE.hover,
  /** 3D depth of field. Lower = more aggressive perspective. */
  perspective = 900,
  /** Hover lift in px. Use this instead of a CSS `translate` on the same
   *  element — a CSS transition on `transform` would re-interpolate every
   *  frame Motion writes and make the tilt feel laggy. */
  liftY = 0,
  /** Ambient frost sheen that follows the pointer. */
  glow = true,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  hoverScale?: number;
  perspective?: number;
  liftY?: number;
  glow?: boolean;
  disabled?: boolean;
}) {
  const fine = useFinePointer();
  const reduce = useReducedMotionSSR();
  const enabled = fine && !reduce && !disabled;

  const ref = useRef<HTMLDivElement>(null);
  // Normalised pointer position: −0.5 (left/top) … 0.5 (right/bottom).
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const stx = useSpring(tx, SPRING.tilt);
  const sty = useSpring(ty, SPRING.tilt);

  const rotateY = useTransform(stx, [-0.5, 0.5], [-maxTilt, maxTilt]);
  const rotateX = useTransform(sty, [-0.5, 0.5], [maxTilt, -maxTilt]);
  // The blob travels a short diagonal of its own, which keeps it on the card
  // (it is oversized by 1/3 on each side and clipped by the frame).
  const glowX = useTransform(stx, [-0.5, 0.5], ["-16%", "16%"]);
  const glowY = useTransform(sty, [-0.5, 0.5], ["-16%", "16%"]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tx.set((e.clientX - r.left) / r.width - 0.5);
      ty.set((e.clientY - r.top) / r.height - 0.5);
    },
    [tx, ty],
  );

  const reset = useCallback(() => {
    tx.set(0);
    ty.set(0);
  }, [tx, ty]);

  return (
    <motion.div
      ref={ref}
      className={cn("tilt-card", className)}
      style={
        enabled
          ? { ...style, rotateX, rotateY, transformPerspective: perspective }
          : style
      }
      onPointerMove={enabled ? onPointerMove : undefined}
      onPointerLeave={enabled ? reset : undefined}
      onPointerCancel={enabled ? reset : undefined}
      whileHover={enabled ? { scale: hoverScale, y: liftY, transition: SPRING.lift } : undefined}
    >
      {children}
      {enabled && glow && (
        <motion.span
          aria-hidden
          className="tilt-glow pointer-events-none absolute -inset-1/3 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--color-frost)_26%,transparent),transparent_62%)]"
          style={{ x: glowX, y: glowY }}
        />
      )}
    </motion.div>
  );
}
