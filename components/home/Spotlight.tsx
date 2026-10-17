"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { SpotlightModel } from "@/lib/providers/types";
import { truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { isInList, toggleList, WATCHLIST_EVENT } from "@/lib/watchlist/local";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";

function totalEpisodes(a: SpotlightModel): number | null {
  return a.episodes.sub ?? a.episodes.dub ?? null;
}

/** Glass-outline "Add to List" toggle, backed by localStorage. */
function MyListButton({ anime }: { anime: SpotlightModel }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(isInList(anime.id));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [anime.id]);

  return (
    <button
      type="button"
      onClick={() =>
        toggleList({ id: anime.id, title: anime.title, poster: anime.poster, type: anime.type })
      }
      aria-pressed={added}
      aria-label={`${added ? "Remove from" : "Add to"} My List: ${anime.title}`}
      className={cn(
        "press flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold backdrop-blur-md transition-colors",
        added
          ? "border-frost/60 bg-frost-soft text-frost"
          : "border-line bg-white/10 text-snow hover:border-frost/50",
      )}
    >
      {added ? <Check className="size-4" /> : <Plus className="size-4" />}
      {added ? "In My List" : "Add to List"}
    </button>
  );
}

/** Five-petal crimson camellia emblem — the reference's right-edge flower. */
function Camellia({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="12"
          cy="7.2"
          rx="3.1"
          ry="4.6"
          fill="var(--color-crimson)"
          opacity="0.92"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.1" fill="var(--color-sakura)" />
    </svg>
  );
}

/**
 * The reference homepage hero: a compact (≈375px) cinematic banner that sits
 * at the very top of the main column, tucked behind the translucent utility
 * bar. Multi-layer parallax (blurred scenery + key art at different rates,
 * pointer-driven on fine pointers), drifting petals, staggered copy, and the
 * signature right-edge vertical Japanese caption with the crimson emblem.
 */
export function Spotlight({ items }: { items: SpotlightModel[] }) {
  const list = items ?? [];
  const n = list.length;
  const [active, setActive] = useState(0);
  const reduce = useReducedMotionSSR();
  // Auto-advance pauses while hovered, focused, or dragging — one flag keeps
  // the carousel calm under interaction.
  const [interacting, setInteracting] = useState(false);

  // Only the slides that have been shown (plus the one queued next) mount
  // their heavy key-art. The crossfade is unaffected — every slide's container
  // stays mounted and animates opacity; network requests are deferred so the
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

  const go = useCallback((idx: number) => setActive(((idx % n) + n) % n), [n]);
  const step = useCallback((dir: 1 | -1) => setActive((p) => (p + dir + n) % n), [n]);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!n || interacting || reduce) return;
    const t = setInterval(() => setActive((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, interacting, reduce]);

  // Multi-layer pointer parallax — writes CSS custom props on the section
  // (no React state per mousemove); the art layers consume them via
  // `translate3d(calc(var(--para-x) * Npx), …)`. Enabled only for fine
  // pointers with motion allowed.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--para-x", x.toFixed(3));
      el.style.setProperty("--para-y", y.toFixed(3));
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduce]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, moved: false };
    setInteracting(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 60) {
      d.moved = true;
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
  const counter = `${String(active + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

  /** Staggered hero-copy chain — one increasing delay per content group. */
  const heroDelay = (ms: number) =>
    ({ "--hero-delay": `${ms}ms` }) as React.CSSProperties;

  return (
    <section
      ref={sectionRef}
      /* Tuck the artwork behind the translucent utility bar: the header is
         64px and <main> adds 16px top padding, so -mt-20 lands the art at the
         very top of the page. Edge-to-edge across the main column via the
         negative-margin compensation (the sidebar owns the space to the left). */
      className="relative z-0 -mx-4 -mt-20 overflow-hidden focus:outline-none select-none sm:-mx-6 lg:-mx-8"
      style={{ "--para-x": 0, "--para-y": 0 } as React.CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured anime"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => {
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
      <div className="relative h-[330px] w-full sm:h-[360px] md:h-[380px]">
        {/* ── Background depth: blurred scenery layer + sharp key art, each in
            its own parallax wrapper moving at a different rate against
            var(--para-x/y). Transform-only; disabled on touch + reduced
            motion (custom props simply never get written). ── */}
        <div className="absolute inset-0">
          {list.map((s, idx) =>
            s.poster ? (
              <div
                key={s.id}
                className={cn(
                  "hero-slide-fade absolute inset-0",
                  idx === active ? "opacity-100" : "opacity-0",
                )}
              >
                {seen.has(idx) && (
                  <div
                    className="absolute -inset-4"
                    style={{
                      transform:
                        "translate3d(calc(var(--para-x) * -22px), calc(var(--para-y) * -14px), 0)",
                    }}
                  >
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
                  </div>
                )}
                {seen.has(idx) ? (
                  <div
                    className="absolute -inset-3"
                    style={{
                      transform:
                        "translate3d(calc(var(--para-x) * -10px), calc(var(--para-y) * -6px), 0)",
                    }}
                  >
                    <Image
                      src={s.poster}
                      alt=""
                      fill
                      sizes="100vw"
                      className={cn(
                        "object-cover object-[center_22%] brightness-[0.94]",
                        idx === active && "hero-art",
                      )}
                      priority={idx === 0}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-surface-2 shimmer-loop" />
                )}
              </div>
            ) : null,
          )}
        </div>

        {/* ── Foreground atmosphere: drifting crimson petals + a snow grace
            note, subtle and few — decoration at reference density. ── */}
        <div aria-hidden className="petal-drift pointer-events-none absolute inset-0 z-[6]">
          {[
            { l: "12%", d: "13s", s: 7, delay: "0s", c: "var(--color-crimson)" },
            { l: "26%", d: "17s", s: 5, delay: "4s", c: "var(--color-sakura)" },
            { l: "58%", d: "15s", s: 6, delay: "2s", c: "var(--color-crimson)" },
            { l: "74%", d: "19s", s: 4, delay: "7s", c: "var(--color-sakura)" },
            { l: "88%", d: "14s", s: 6, delay: "5s", c: "var(--color-crimson)" },
          ].map((petal, i) => (
            <span
              key={i}
              className="absolute top-0 block"
              style={{
                left: petal.l,
                width: petal.s,
                height: petal.s,
                background: petal.c,
                borderRadius: "60% 0 60% 60%",
                animation: `hero-petal-drift ${petal.d} linear ${petal.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Light field + scrims (calibrated for the short hero so the copy
            stays readable over any artwork) ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aurora-a absolute -left-[12%] top-[6%] h-[70%] w-[55%] rounded-full bg-frost/10 blur-[110px]" />
          <div className="aurora-b absolute -right-[10%] top-[30%] h-[70%] w-[46%] rounded-full bg-frost-deep/10 blur-[120px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-base/95 via-base/45 to-base/55" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-base/90 via-base/35 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-base/70 to-transparent" />

        {/* ── Right edge signature: vertical Japanese reading of the brand
            (from the reference), crimson camellia, and the site motto. ── */}
        <div
          aria-hidden
          className="hero-in absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-4 xl:flex"
          style={heroDelay(520)}
        >
          <p className="font-display text-[15px] italic leading-snug text-snow/60 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
            “The snow
            <br />
            remembers
            <br />
            everything.”
          </p>
          <p className="vertical-rl font-zen text-sm text-snow/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
            そでのしたゆき
          </p>
          <Camellia className="size-6 drop-shadow-[0_2px_8px_rgba(159,48,74,0.7)]" />
        </div>

        {/* ── Copy + CTAs — the reference stage: Japanese micro-label above the
            serif title, one-line meta, two-line synopsis, pill CTAs. The text
            stack is keyed by the active slide (staggered rise replays); the
            CTA row stays planted across changes. ── */}
        <div className="relative z-10 flex h-full items-end">
          <div className="mx-auto w-full max-w-[1460px] px-4 pb-7 sm:px-6 sm:pb-8 lg:px-8">
            <div className="flex max-w-xl flex-col gap-2.5">
              <div key={active} className="contents">
                {a.jname && (
                  <p
                    className="hero-in font-zen text-[11px] tracking-[0.3em] text-frost/90 [@media(max-height:420px)]:hidden"
                    style={heroDelay(0)}
                  >
                    {a.jname}
                  </p>
                )}
                <h2
                  className="hero-in font-display truncate text-[32px] font-semibold leading-[1.05] text-snow [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[40px] md:text-[46px]"
                  style={heroDelay(60)}
                >
                  {a.title}
                </h2>

                {a.description && (
                  <p
                    className="hero-in max-w-md text-[13px] leading-relaxed text-muted [@media(max-height:420px)]:hidden sm:line-clamp-2"
                    style={heroDelay(160)}
                  >
                    {truncate(a.description, 132)}
                  </p>
                )}

                {/* Meta line — single horizontal strip like the reference;
                    segments are joined only when their field exists, so a
                    missing score/year never leaves a stray leading divider. */}
                {(() => {
                  const segs: string[] = [];
                  if (a.score) segs.push(`★ ${a.score}`);
                  if (a.type) segs.push(a.type);
                  if (a.quality) segs.push(a.quality);
                  if (eps != null) segs.push(`${eps} eps`);
                  if (!segs.length) return null;
                  return (
                    <p
                      className="hero-in flex flex-wrap items-center gap-2.5 text-[12.5px] text-snow/90 [@media(max-height:420px)]:hidden"
                      style={heroDelay(260)}
                    >
                      {segs.map((seg, i) => (
                        <span key={seg} className="flex items-center gap-2.5">
                          {i > 0 && (
                            <span className="text-snow/30" aria-hidden>
                              |
                            </span>
                          )}
                          <span>{seg}</span>
                        </span>
                      ))}
                    </p>
                  );
                })()}
              </div>

              <div className="hero-in mt-1.5 flex items-center gap-3" style={heroDelay(360)}>
                <Link
                  href={`/watch/${a.id}`}
                  className="press flex items-center gap-2 rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-[#06101E] shadow-[0_6px_24px_-8px_rgba(242,245,250,0.5)]"
                >
                  <Play className="size-4 fill-current" /> Watch Now
                </Link>
                <MyListButton anime={a} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Carousel controls — circular prev/next + “01 / 05” counter at
            the lower right, exactly as in the reference. ── */}
        {n > 1 && (
          <div className="absolute bottom-6 right-5 z-20 hidden items-center gap-3 sm:right-8 md:flex">
            <button
              onClick={() => step(-1)}
              aria-label="Previous slide"
              className="press grid size-9 place-items-center rounded-full border border-line/80 bg-base/40 text-snow/90 backdrop-blur-md transition-colors hover:border-frost/60 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span aria-live="polite" className="text-sm font-semibold tabular-nums text-snow">
              {counter}
            </span>
            <button
              onClick={() => step(1)}
              aria-label="Next slide"
              className="press grid size-9 place-items-center rounded-full border border-line/80 bg-base/40 text-snow/90 backdrop-blur-md transition-colors hover:border-frost/60 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* Keyboard/AT-only alternative for the same actions on small screens. */}
        {n > 1 && (
          <div className="sr-only">
            <button onClick={() => step(-1)}>Previous slide</button>
            <button onClick={() => step(1)}>Next slide</button>
          </div>
        )}
      </div>
    </section>
  );
}
