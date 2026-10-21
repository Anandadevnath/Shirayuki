import Image from "next/image";

/**
 * Anime-specific cinematic backdrop for the detail page.
 *
 * The current title's own artwork (wide `cover` preferred, poster fallback)
 * is painted as a full-viewport fixed layer BEHIND the page, then scrimmed
 * back with a stack of overlays so the interface stays readable on top of it.
 *
 * Why it reads as "immersive" and not "a stretched poster pasted behind the
 * page":
 *  - The art is `object-cover` across the viewport, never letterboxed.
 *  - `object-[50%_22%]` biases the crop toward the upper third, where key
 *    art keeps faces/titles instead of the flat lower padding.
 *  - A top-weighted header scrim keeps the (transparent-at-scroll-0) navbar
 *    legible directly over the raw art.
 *  - The heavy fade is at the BOTTOM: the lower ~60% resolves to solid
 *    `base`, so cards/rails (which carry their own inner scrims) seat on a
 *    calm field while the art is strongest behind the hero.
 *  - A subtle radial vignette darkens the edges/corners.
 *  - Only a restrained blur(4px) + desaturation is used — enough to keep
 *    foreground type crisp, not so much that the identity is lost.
 *
 * The layer is `fixed`, so it already covers the whole scroll length (no
 * cutoff between hero and lower sections) and, being server-rendered, it
 * changes with the route's `key` on navigation — the previous anime's art
 * can never linger over the new page.
 *
 * Graceful fallback: with no artwork the component renders only the scrim
 * stack over the page's `base` background, i.e. exactly today's dark theme.
 */
export function DetailBackdrop({ src }: { src: string | null }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-5] overflow-hidden"
    >
      {src && (
        // `alt=""` + aria-hidden: purely decorative. The parent is
        // `position: fixed`, matching next/image `fill`'s requirement.
        // quality 50 matches the other full-bleed hero surfaces and keeps
        // the optimised payload small. No `priority`: the LCP is the
        // foreground poster/title, so this paints as a normal request and
        // never competes with it for the preload slot.
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          quality={50}
          className="object-cover object-[50%_22%] scale-105 blur-[4px] saturate-[0.9]"
        />
      )}

      {/* Scrim stack — three controlled layers, no abrupt band:
          1. Vertical fade: raw art stays visible behind the hero (top), then
             dissolves to solid `base` through the lower third, so lower
             sections seat on a calm field.
          2. Horizontal tint: deepens the content-column side and softens the
             outer edge.
          3. Vignette: subtle corner darkening, no hard ring.
          The former separate header scrim was folded into layer 1 — the
          vertical fade is strong enough over the top that the navbar and
          breadcrumb stay legible without a fourth overlay. */}
      <div className="absolute inset-0 bg-gradient-to-b from-base/45 via-base/70 to-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-base/70 via-base/15 to-base/45" />
      <div className="absolute inset-0 bg-[radial-gradient(115%_90%_at_50%_38%,transparent_38%,var(--color-base)_100%)]" />
    </div>
  );
}
