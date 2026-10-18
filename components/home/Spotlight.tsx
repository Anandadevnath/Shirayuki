"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Play,
  Plus,
  Check,
  Star,
  Film,
  Flame,
  Diamond,
} from "lucide-react";
import type { SpotlightModel } from "@/lib/providers/types";
import { EpBadges } from "@/components/anime/Badges";
import { TapButton, TapLink, pressProps } from "@/components/motion/tappable";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";
import { truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { isInList, toggleList, WATCHLIST_EVENT } from "@/lib/watchlist/local";

function totalEpisodes(a: SpotlightModel): number | null {
  return a.episodes.sub ?? a.episodes.dub ?? null;
}

/** Glass-outline "My List" toggle, backed by localStorage. */
function MyListButton({ anime }: { anime: SpotlightModel }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(isInList(anime.id));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [anime.id]);

  return (
    <TapButton
      type="button"
      onClick={() =>
        toggleList({ id: anime.id, title: anime.title, poster: anime.poster, type: anime.type })
      }
      aria-pressed={added}
      aria-label={`${added ? "Remove from" : "Add to"} My List: ${anime.title}`}
      {...pressProps}
      className={cn(
        "text-btn flex h-11 items-center gap-2 rounded-[var(--radius-btn)] border px-5 backdrop-blur-md transition-colors",
        added
          ? "border-frost/50 bg-frost-soft text-frost"
          : "border-line bg-base/30 text-snow hover:border-frost/40 hover:text-frost",
      )}
    >
      {added ? <Check className="size-4" /> : <Plus className="size-4" />}
      {added ? "In My List" : "My List"}
    </TapButton>
  );
}

/**
 * Cinematic, calm hero. Full-bleed key art with a vertical "featured" strip on
 * the left, the title's Japanese name set as oversized vertical type on the
 * right, and the copy + CTAs anchored low-left. The trending rail now lives in
 * its own section below — the hero stays uncluttered and atmospheric.
 */
const MAX_SLIDES = 7;

/** Sparse crimson-petal field — six petals with varied fall duration, start
 *  delay, horizontal sway and peak opacity. Decorative only (aria-hidden in
 *  the JSX), pure CSS transform/opacity loops, hidden under reduced-motion. */
const PETALS = [
  { left: 58, dur: 13, delay: 0, x: 9, o: 0.55 },
  { left: 67, dur: 17, delay: 3.5, x: -7, o: 0.4 },
  { left: 76, dur: 15, delay: 7, x: 11, o: 0.5 },
  { left: 86, dur: 19, delay: 1.8, x: -9, o: 0.35 },
  { left: 44, dur: 21, delay: 5, x: -12, o: 0.3 },
  { left: 93, dur: 16, delay: 10, x: 7, o: 0.45 },
];

export function Spotlight({ items }: { items: SpotlightModel[] }) {
  const list = (items ?? []).slice(0, MAX_SLIDES);
  const n = list.length;
  const [active, setActive] = useState(0);
  // Auto-advance pauses while hovered, focused, or dragging — single flag
  // mirrors LatestEpisodes so both carousels feel identical to the user.
  const [interacting, setInteracting] = useState(false);

  // ── Scroll parallax ────────────────────────────────────────────────────
  // As the hero leaves the viewport the art lags (moves down relative to the
  // page) and the copy rises and fades, so the section reads as a scene the
  // camera pulls out of rather than a flat block scrolling up. Transform-only,
  // so the hero never reflows and never invalidates a paint; the values are
  // only ever read by the `style` of the layers below, so nothing here causes
  // a React re-render.
  //
  // Gated off entirely for reduced-motion users: `MotionConfig`'s
  // `reducedMotion="user"` neutralises Motion's *animations*, but a motion
  // value written straight to `style` is not an animation and would slip past
  // it, so this channel carries its own gate.
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotionSSR();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const artScrollY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  // ── Initial-reveal gate ────────────────────────────────────────────────
  // `artReady` gates ONLY the heavy key art — not the copy. The hero's copy
  // is text that was ready the moment the models arrived; holding it behind
  // the 1920px key-art decode made the whole hero lag behind Trending (which
  // paints as soon as its smaller 256px posters land). So the copy paints
  // immediately over a skeleton BACKGROUND, and the key art crossfades in
  // beneath it once decoded. `artReady` is monotonic — it never resets — so
  // slide changes, re-renders and data updates can never replay the entrance;
  // slide swaps keep using the mounted 800ms crossfade instead.
  // Errors also mark art ready (frosted fallback surface), so a broken poster
  // URL can never leave a permanent skeleton background.
  const [artReady, setArtReady] = useState(false);
  const artRef = useRef<HTMLImageElement>(null);
  const markArtReady = useCallback(() => setArtReady(true), []);

  // Cached-at-hydration path: `onLoad` never fires for an <img> that already
  // completed before React hydrates, so check completeness pre-paint. Runs on
  // mount (cached reload → hero reveals without an entrance flash) and when
  // the active slide changes (switching to an already-decoded slide is a
  // no-op once revealed).

  // Only the slides that have been shown (plus the one queued next) mount their
  // heavy key-art. The crossfade is unaffected — every slide's container stays
  // mounted and animates opacity; we just defer the <Image> network requests so
  // first paint fetches one slide's art instead of all N.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    setSeen((prev) => {
      const nextIdx = (active + 1) % n;
      if (prev.has(active) && prev.has(nextIdx)) return prev;
      const next = new Set(prev);
      next.add(active);
      next.add(nextIdx);
      return next;
    });
  }, [active, n]);

  // `useLayoutEffect` so a cached bitmap reveals the hero art BEFORE the first
  // client paint — the skeleton background is dropped in the same frame the
  // browser would have painted it, so a warm refresh shows no skeleton flash.
  useLayoutEffect(() => {
    if (artReady) return;
    const img = artRef.current;
    if (!img) return;
    // complete + non-zero natural size = decoded and paintable right now.
    if (img.complete && img.naturalWidth > 0) markArtReady();
    // complete + zero size = decode failure (broken/cancelled request) —
    // reveal the art layer anyway; the frosted fallback is the hero background.
    else if (img.complete) markArtReady();
  }, [artReady, active, seen, markArtReady]);

  // No key art on the active slide (empty/missing poster URL): there is no
  // bitmap to wait for, so the art layer must clear at once. Without this an
  // art-less slide mounts no <img>, `onLoad` can never fire, and the skeleton
  // background would linger. Layout effect so it lands pre-paint.
  useLayoutEffect(() => {
    if (artReady) return;
    if (!list[active]?.poster) markArtReady();
  }, [artReady, active, list, markArtReady]);

  // Bounded grace: if the key art neither loads nor errors within a short
  // window (a stalled request the browser never resolves, or a slow connection
  // where the 1920px hero can't arrive), drop the skeleton background so a
  // slow image can never leave the hero on a placeholder indefinitely. The
  // copy is already visible throughout; this only controls the background
  // layer. Cleared once ready — the normal path pays nothing.
  useEffect(() => {
    if (artReady) return;
    const t = setTimeout(markArtReady, 2500);
    return () => clearTimeout(t);
  }, [artReady, markArtReady]);

  const go = useCallback((idx: number) => setActive(((idx % n) + n) % n), [n]);
  // Wrap-around step used by both keyboard arrows and drag-to-swipe.
  const step = useCallback(
    (dir: 1 | -1) => setActive((p) => (p + dir + n) % n),
    [n],
  );
  // Drag-to-swipe: pointer-down captures the start X, any horizontal move past
  // the 60px threshold steps the carousel once (in the drag direction). The
  // slide change uses the existing opacity crossfade — no rubber-band
  // translation, the image stays put while the drag is in flight.
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  // Auto-rotate — gated on !interacting (hover/focus/drag) and reduced-motion.
  useEffect(() => {
    if (!n || interacting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, interacting]);

  // Keyboard arrows when the section has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  // Pointer / touch swipe. Pointer Events cover mouse + touch + pen in one
  // path; we DON'T capture the pointer on press so that clicks on the Watch
  // Now / My List buttons still fire normally — capture happens on the first
  // horizontal move past the threshold instead, which guarantees a pure
  // press-then-release with no movement still routes to the underlying button.
  // We also don't translate the slide under the cursor — the image stays put
  // while the drag is in flight, and the crossfade swaps to the next slide
  // once the threshold is crossed.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return; // primary button only
    drag.current = { x: e.clientX, moved: false };
    setInteracting(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 60) {
      d.moved = true;
      // Now that we've committed to a drag, capture the pointer so a release
      // outside the section still ends the gesture cleanly.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      step(dx < 0 ? 1 : -1);
    }
  };
  const endDrag = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    drag.current = null;
    setInteracting(false);
  };

  if (!n) return null;
  const a = list[active];
  const eps = totalEpisodes(a);

  /** Staggered hero-copy chain — one increasing delay per content group. */
  const heroDelay = (ms: number) =>
    ({ "--hero-delay": `${ms}ms` }) as React.CSSProperties;

  // Full-bleed breakout, scrollbar-safe. The section lives inside <main>'s
  // centred, max-width column, but must reach the true viewport edges. We use
  // container-query units instead of `w-screen`: <main> is the size container
  // (`page-container`), so `100cqw` is the scrollbar-excluded layout width,
  // whereas `100vw` includes the classic vertical scrollbar and made the
  // section protrude past the right edge by the scrollbar width (clipping a
  // sliver of the hero under the sticky nav). `left-[calc(50%-50cqw)]` shifts
  // the box from the column's content-left back to <main>'s left edge, so the
  // section spans exactly `100cqw` with no overshoot at any viewport.
  // `overflow-x-clip` (NOT overflow-hidden) still clips the blurred fill art's
  // horizontal spill on this element while leaving the vertical axis free for
  // the atmosphere wrapper to extend past the section's bottom.
  //
  // The pull-up must clear EVERYTHING the layout puts above the hero, or the
  // hero's leading edge lands *inside* the viewport and leaves a strip of bare
  // page background behind the transparent navbar — a hard horizontal seam at
  // the top of the home page (the artwork, its scrim and the page background
  // visibly meeting on one row). Two things occupy that space: the sticky
  // <header> (h-16 = 4rem, which still takes part in normal flow) and
  // `.page-shell`'s top inset (`--space-page-y`). Pulling the hero up by
  // exactly their sum puts its top edge at y = 0, so the art and its leading
  // scrim sit behind the whole navbar instead of starting under it.
  return (
    <section
      ref={sectionRef}
      className="relative left-[calc(50%-50cqw)] -mt-[calc(4rem_+_var(--space-page-y))] w-[100cqw] overflow-x-clip focus:outline-none focus-visible:ring-1 focus-visible:ring-frost/60 touch-pan-y select-none"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured anime"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => {
        // Don't release `interacting` mid-drag — the pointer may briefly leave
        // the section as it crosses an internal edge, and we don't want the
        // autoplay timer to restart under the user's finger.
        if (drag.current) return;
        setInteracting(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
    >
      <div className="relative flex h-[94svh] min-h-[min(680px,94svh)] max-h-[1120px] w-full flex-col">
        {/* ── Atmosphere — art, aurora and petals share ONE alpha mask that
            extends 12rem PAST the hero's bottom edge (exactly the Trending
            `-mt-48` overlap). The artwork therefore never terminates at the
            hero container boundary: it continues into the transition area and
            its own alpha eases 100% → 60% → 28% → 10% → 0 there, so the
            boundary row and the rows below it are the same continuous paint.
            pointer-events-none keeps the overhang from stealing hovers or
            swipes from the Trending cards riding above it. ── */}
        {/* The whole atmosphere plane (key art + blurred fill + aurora +
            petals) is one parallax layer: it lags the scroll, so the copy in
            front of it separates cleanly. Transform-only, and the layers
            underneath keep their own CSS keyframes — Motion's transform lives
            on this wrapper, never on an element that a CSS animation also
            drives. */}
        <motion.div
          aria-hidden
          className="art-dissolve pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+12rem)]"
          style={reduce ? undefined : { y: artScrollY }}
        >
          <div className="absolute inset-0">
            {list.map((s, idx) =>
              s.poster ? (
                <div
                  key={s.id}
                  className={cn(
                    // Slide swap crossfade — 800ms so the outgoing art lingers
                    // a beat and the change reads as a dissolve, not a blink.
                    "hero-slide-fade absolute inset-0",
                    idx === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  {/* Blurred fill — same URL, AVIF/WebP via next/image, paints
                      underneath the sharp key art. quality=50 is small enough
                      to keep the blurred backdrop cheap; the 2.4x scale + blur
                      hides any softness. Its settle animation runs at a
                      different rate than the sharp art (9s vs 7.5s), which
                      separates the two planes into a restrained parallax. */}
                  {seen.has(idx) && (
                    <Image
                      src={s.poster}
                      alt=""
                      aria-hidden
                      fill
                      sizes="100vw"
                      quality={50}
                      className={cn(
                        "scale-110 object-cover opacity-60 blur-2xl",
                        idx === active && "hero-backdrop-art",
                      )}
                    />
                  )}
                  {seen.has(idx) ? (
                    <Image
                      src={s.poster}
                      alt=""
                      fill
                      sizes="100vw"
                      // Only the active slide's key art gates the initial
                      // reveal: its onLoad marks the hero ready (network
                      // path), its onError falls back to "ready" so a broken
                      // URL reveals the blurred fill / frosted surface rather
                      // than looping a skeleton forever. The ref powers the
                      // cached-at-hydration completeness check above.
                      ref={idx === active ? artRef : undefined}
                      onLoad={idx === active ? markArtReady : undefined}
                      onError={idx === active ? markArtReady : undefined}
                      className={cn(
                        // No brightness filter: the art must keep the palette
                        // it was drawn with. Readability comes entirely from
                        // the scrims below, which are placed only where copy
                        // actually sits — a full-frame `brightness()` dimmed
                        // every slide's artwork to fix a problem that is
                        // local to the copy column.
                        "object-cover object-[center_22%]",
                        // Cinematic settle: each activation starts from a 4.5%
                        // zoom and eases to rest over 7.5s — slower than the
                        // 7s autoplay cadence, so art is always winding down
                        // whenever a change lands. Transform-only; the art
                        // never drives layout. Removing the class on the
                        // inactive slide resets scale to 1 invisibly (opacity
                        // is 0), so the next activation zooms fresh.
                        idx === active && "hero-art",
                      )}
                      priority={idx === 0}
                    />
                  ) : (
                    /* Skeleton-grade placeholder for unseen slides; matches the
                       exact dimensions of the sharp <Image> so when it swaps in
                       there's zero layout shift. */
                    <div className="absolute inset-0 bg-surface-2 shimmer-loop" />
                  )}
                </div>
              ) : null,
            )}
          </div>

          {/* ── Atmospheric light — two low-opacity frost light fields that
              drift on long transform-only loops (26s / 32s). They sit ABOVE
              the art and BELOW every scrim + text layer, so they read as
              ambient scene lighting, never as a veil over the copy, and are
              frozen entirely under reduced-motion. The drift keyframes stay on
              the two children, and no transform is applied here, so nothing
              can collide with a CSS-driven transform. ── */}
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="aurora-a absolute -left-[12%] top-[12%] h-[62%] w-[55%] rounded-full bg-frost/[0.08] blur-[130px]" />
            <div className="aurora-b absolute -right-[10%] top-[38%] h-[58%] w-[46%] rounded-full bg-frost-deep/[0.08] blur-[140px]" />
          </div>

          {/* ── Drifting crimson petals — the sakura accent: a sparse field of
              six petals falling through the scene at staggered speeds and
              sway amplitudes (pure transform/opacity CSS loops, decorative,
              aria-hidden, pointer-events-none). They share the atmosphere
              mask, and are hidden entirely under reduced-motion. ── */}
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            {PETALS.map((p, i) => (
              <span
                key={i}
                className="petal"
                style={
                  {
                    left: `${p.left}%`,
                    "--petal-dur": `${p.dur}s`,
                    "--petal-delay": `${p.delay}s`,
                    "--petal-x": `${p.x}vw`,
                    "--petal-o": p.o,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </motion.div>

        {/* Cinematic scrims — a gentle vignette so the art reads as one calm
            scene: darker at the edges and base, lighter through the middle. The
            top scrim extends well above the hero's visible top (h-56 / 14rem)
            and starts at full opacity, so the navbar region feels like part of
            the same downward-fading gradient rather than a separate "header
            zone". The leading edge sits at the absolute top of the section,
            so the navbar (which overlaps the section via -mt-24) blends into
            the gradient instead of clipping it. Both the horizontal and bottom
            scrims share `scrim-dissolve`: their tint MUST reach zero before
            the hero's bottom edge — an edge-vignette at full strength on the
            last pixel row and absent on the next one is what painted the old
            horizontal seam. */}
        <div aria-hidden className="scrim-dissolve pointer-events-none absolute inset-0">
          {/* Readability gradient. It exists for exactly one reason: the copy
              column (`max-w-xl`, i.e. the left ~40% of the frame at desktop
              widths) needs a dark bed under near-white type. Everything the
              scrim does past the point where copy stops is pure veiling, so:

              · through the copy column the tint is unchanged from the design
                (0.95 → 0.55 at 45%) — the paragraph keeps the bed it was
                tuned against, at every breakpoint;
              · past it, `lg:` lets the veil fall to 0.15 instead of holding a
                ~45% tint across the whole frame. That held tint is what made
                every slide read muddy: at 1440px it covered ~60% of the
                artwork at 45–50% black, i.e. the picture was showing at
                little over half strength before the art filter even applied.
              The tail only opens from `lg` up because below that the synopsis
              spans the full width and still sits under the tail. */}
          <div className="absolute inset-0 bg-gradient-to-r from-base/95 via-base/55 via-45% to-base/45 lg:to-base/15" />
          {/* Bottom atmosphere — a light vignette at the hero's base. Dissolves
              with the group above, so it can never read as a step where the
              hero ends: the artwork tail beneath it continues smoothly into
              the Trending overlap. Kept deliberately shallow — it darkens the
              artwork, not any copy. */}
          <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-base/45 via-base/12 to-transparent" />
        </div>
        {/* Top band — the navbar is fully transparent at scroll 0
            (`.nav-glass`), so this is the ONLY thing keeping the nav labels
            readable while the hero art passes behind them. It fades out well
            before the copy starts, so it darkens the sky, never the title. */}
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-base/80 via-base/45 via-38% to-transparent" />

        {/* ── Art placeholder — sits BENEATH the copy (z-0), mirroring the
            route-level SpotlightSkeleton's backdrop so the skeleton → board
            swap keeps identical geometry. It holds the hero's background
            surface (shimmer) only until the active slide's key art decodes,
            then is removed so nothing keeps ticking behind live content.
            The copy above is NEVER gated on this: it is text that was ready at
            mount, so the hero reads as content immediately instead of waiting
            on the 1920px image. pointer-events-none so it can't intercept the
            CTA clicks while it is still visible. ── */}
        {!artReady && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 bg-surface-2 shimmer-loop"
          />
        )}

        {/* ── Right vertical diamond nav — one facet per slide (carousel
            jumps), plus keyboard arrows and drag-to-swipe. The old prev /
            next arrow buttons were removed for a clean, chrome-free banner.
            The left "Featured" strip lives INSIDE the shared content
            container above. ── */}
        {n > 1 && artReady && (
          <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 sm:right-7 sm:flex">
            {list.map((_, idx) => (
              <button
                key={idx}
                onClick={() => go(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === active}
                className="group grid place-items-center p-1 transition-transform hover:scale-125"
              >
                <Diamond
                  className={cn(
                    "transition-[color,fill]",
                    idx === active
                      ? "size-3.5 fill-frost text-frost drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                      : "size-2.5 fill-snow/25 text-snow/25 group-hover:fill-snow/60 group-hover:text-snow/60",
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Carousel nav happens via the right-edge diamond facets (direct-slide
            jumps), keyboard arrows and drag-to-swipe. The old prev / next arrow
            buttons were removed for a clean, chrome-free banner. ── */}

        {/* ── Copy + CTAs, centred in the full-height hero with a slight
            upward bias (pb-[8vh]) so the block sits comfortably above the
            bottom fade — balanced composition, nothing tucks under the hero.

            Rendered unconditionally: the copy is text that was ready the
            moment the models arrived, so it must not wait on the key-art
            decode (that dependency is what made the hero lag Trending on the
            first load). It paints over the art placeholder immediately; the
            key art crossfades in beneath it when decoded.

            Choreography: the text stack is keyed by the active slide, so
            every change replays a staggered rise (title → meta → synopsis
            → stats, 90ms apart, ~0.7s each). The CTA row is intentionally
            NOT keyed — the buttons stay planted under the cursor between
            slide changes (remounting them both flickers the My List state
            and yanks click targets mid-interaction). ── */}
        {/* The copy is the near plane: it rises and fades a little as the hero
            scrolls away. The stagger choreography above is untouched (it is
            CSS, keyed per slide). */}
        <motion.div
          className="relative z-10 flex flex-1 items-center pb-[10vh]"
          style={reduce ? undefined : { y: copyScrollY, opacity: copyOpacity }}
        >
          {/* This container is the SHARED content container — identical to
              <main>'s mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8 — so the
              hero title/copy/CTA block shares its exact left and right
              boundaries with every homepage section (Trending heading, card
              rails, grids). Do not add asymmetric padding here; the vertical
              "Featured" strip below decorates the gutter instead of pushing
              the copy off-alignment. */}
          <div className="relative mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
            {/* Left vertical "featured" strip — absolutely positioned inside
                the shared container's left padding gutter (0 → ~20px wide,
                text starts at 32px), so it never displaces the copy and both
                edges stay flush with the sections below. Simplified to a
                single hairline rule above and below the label; the rule pair
                reads as a deliberate marker rather than decoration. */}
            <div
              className="hero-in pointer-events-none absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
              style={heroDelay(520)}
            >
              <span className="h-14 w-px bg-gradient-to-b from-transparent to-frost/50" />
              <span
                className="text-label text-frost"
                style={{ writingMode: "vertical-rl", letterSpacing: "0.42em" }}
              >
                Featured
              </span>
              <span
                className="font-accent text-[11px] font-medium tabular-nums text-snow/65"
                style={{ writingMode: "vertical-rl" }}
              >
                {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </span>
              <span className="h-14 w-px bg-gradient-to-b from-frost/50 to-transparent" />
            </div>
            {/* Hero copy stack. Spacing follows a deliberate scale, not one
                uniform gap: the title owns its own leading, then a 24px beat
                to the badges, 20px to the synopsis block, and a 32px beat to
                the action row — so each tier reads as its own group instead
                of a single cramped column. The synopsis + stats share the
                middle block (gap-3) since they are one "about this title"
                unit. The stack itself is `gap-5` as the baseline rhythm; the
                per-tier margins below are the intentional overrides. */}
            <div className="flex max-w-xl flex-col gap-5">
              {/* Line-clamped rows keep per-slide text heights stable, so the
                  keyed re-render can never shift layout — the hero's own
                  height is viewport-fixed and everything inside is
                  height-capped. */}
              <div key={active} className="contents">
                <h2
                  className="hero-in text-hero line-clamp-2 [text-shadow:0_2px_20px_rgba(0,0,0,0.75)]"
                  style={heroDelay(60)}
                >
                  {a.title}
                </h2>

                {/* Metadata row — real fields only */}
                <div
                  className="hero-in flex flex-wrap items-center gap-2 text-meta text-muted"
                  style={heroDelay(150)}
                >
                  {a.type && (
                    <span className="rounded-[var(--radius-btn)] border border-line bg-base/40 px-2.5 py-1 backdrop-blur-sm">
                      {a.type}
                    </span>
                  )}
                  {a.quality && (
                    <span className="rounded-[var(--radius-btn)] bg-frost-soft px-2.5 py-1 font-semibold text-frost">
                      {a.quality}
                    </span>
                  )}
                  <EpBadges sub={a.episodes.sub} dub={a.episodes.dub} />
                </div>

                {/* Directly under the actionable badges; the synopsis + stats
                    are grouped so the "about" block reads as one unit. */}
                <div className="hero-in flex flex-col gap-3" style={heroDelay(240)}>
                  {a.description && (
                    <p className="text-desc max-w-lg text-muted/90 [@media(max-height:480px)]:hidden sm:line-clamp-2">
                      {truncate(a.description, 170)}
                    </p>
                  )}

                  {/* Episode / rating / rank row — its own tier, separated from
                      the synopsis above and the CTAs below so the facts never
                      crowd the prose. */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-meta font-medium text-snow [@media(max-height:480px)]:hidden">
                    {!!a.score && (
                      <span className="flex items-center gap-1.5">
                        <Star className="size-4 fill-warning text-warning" /> {a.score}
                        <span className="text-faint">Rating</span>
                      </span>
                    )}
                    {eps != null && (
                      <span className="flex items-center gap-1.5">
                        <Film className="size-4 text-frost" /> {eps}
                        <span className="text-faint">Episodes</span>
                      </span>
                    )}
                    {typeof a.rank === "number" && (
                      <span className="flex items-center gap-1.5">
                        <Flame className="size-4 text-sakura" />
                        <span className="text-faint">Trending</span> #{a.rank}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CTAs — stable across slide changes. The extra `mt-3` on top of
                  the stack's `gap-5` gives this row the largest beat (~32px),
                  lifting the actions clear of the descriptive copy. */}
              <div className="hero-in mt-3 flex flex-wrap items-center gap-3" style={heroDelay(430)}>
                {/* Primary action: spring-backed hover/press (the `.press` CSS
                    class it used to carry is superseded by the same feedback
                    done with springs). */}
                <TapLink
                  href={`/watch/${a.id}`}
                  {...pressProps}
                  className="text-btn flex h-11 items-center gap-2 rounded-[var(--radius-btn)] bg-frost px-5 text-base"
                >
                  <Play className="size-4 fill-current" /> Watch Now
                </TapLink>
                <MyListButton anime={a} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}