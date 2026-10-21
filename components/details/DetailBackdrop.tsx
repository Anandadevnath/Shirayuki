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

      {/* Header scrim — a light top-down dim so the navbar + breadcrumb stay
          readable where the art is brightest (the navbar is transparent until
          it scrolls, per .nav-glass). */}
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-base/80 via-base/35 to-transparent" />

      {/* Primary scrim — vertically weighted dark tint. The art stays
          visible behind the hero, then the page dissolves into solid base
          through the lower two-thirds. */}
      <div className="absolute inset-0 bg-gradient-to-b from-base/55 via-base/75 to-base" />

      {/* Left-to-right scrim — deepens the inset side the content column
          sits on and lets the right edge read as a soft falloff. */}
      <div className="absolute inset-0 bg-gradient-to-r from-base/70 via-base/20 to-base/45" />

      {/* Edge vignette — subtle corner darkening, no hard ring. */}
      <div className="absolute inset-0 bg-[radial-gradient(115%_90%_at_50%_38%,transparent_38%,var(--color-base)_100%)]" />
    </div>
  );
}
