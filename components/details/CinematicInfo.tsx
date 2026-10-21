"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Star, Tv, Clock, Film, Calendar, Building2, Plus,
  Share2, Check, Sparkles, Award, Languages, Activity,
} from "lucide-react";
import type { AnimeDetail } from "@/lib/providers/types";
import { TiltCard } from "@/components/motion/TiltCard";
import { cn } from "@/lib/utils/cn";
import { revealDelay } from "@/lib/utils/reveal";
import { isInList as isInListLocal, toggleList, WATCHLIST_EVENT } from "@/lib/watchlist/local";
import { COMPLETED_EVENT, isCompleted, setCompleted } from "@/lib/completed/local";
import { ReadMore } from "./ReadMore";

/**
 * The slice of the normalized detail model this panel renders. Derived from the
 * canonical provider type (a `Pick`) rather than re-declared field by field, so
 * the two can never drift apart.
 */
type CinematicAnime = Pick<
  AnimeDetail,
  | "id"
  | "title"
  | "jname"
  | "ename"
  | "description"
  | "poster"
  | "cover"
  | "type"
  | "status"
  | "year"
  | "season"
  | "score"
  | "malScore"
  | "rating"
  | "duration"
  | "aired"
  | "genres"
  | "studios"
  | "episodes"
>;

interface CinematicInfoProps {
  anime: CinematicAnime;
  category: "sub" | "dub";
  epNum: number;
}

/* ── helpers ────────────────────────────────────────────────────── */

function formatDuration(d: number | null | undefined): string {
  if (d == null) return "—";
  if (d < 60) return `${d} min`;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatEpisodes(
  eps: { sub: number | null; dub: number | null } | undefined,
): string {
  if (!eps) return "—";
  if (eps.sub != null && eps.dub != null) return `${eps.sub} / ${eps.dub}`;
  if (eps.sub != null) return String(eps.sub);
  if (eps.dub != null) return String(eps.dub);
  return "—";
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const isFinished =
    lower.includes("finished") || lower.includes("completed") || lower.includes("ended");
  const isAiring = lower.includes("airing") || lower.includes("ongoing");
  const isUpcoming = lower.includes("upcoming") || lower.includes("not yet");
  const cls = isFinished
    ? "border-success/30 bg-success/10 text-success"
    : isAiring
    ? "border-frost/30 bg-frost-soft text-frost"
    : isUpcoming
    ? "border-warning/30 bg-warning/10 text-warning"
    : "border-line/60 bg-surface/40 text-muted";
  const dot = isFinished
    ? "bg-success"
    : isAiring
    ? "bg-frost animate-[caret-blink_1.6s_ease-in-out_infinite]"
    : isUpcoming
    ? "bg-warning"
    : "bg-faint";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "frost",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: "frost" | "gold" | "success" | "muted";
}) {
  const accentMap = {
    frost: "text-frost",
    gold: "text-warning",
    success: "text-success",
    muted: "text-muted",
  };
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-md border border-line/60 bg-surface/60 p-3",
        "hover-lift hover:border-frost/30 hover:bg-surface-2/60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-sm border border-line/60 bg-base/60",
            accentMap[accent],
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-faint">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-snow">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RatingBadge({ score, malScore }: { score: number | null | undefined; malScore: string | null | undefined }) {
  const hasScore = typeof score === "number" && score > 0;
  const display = hasScore ? score!.toFixed(1) : malScore ?? "—";
  return (
    <div className="relative inline-flex items-center gap-2 rounded-md border border-warning/30 bg-gradient-to-br from-warning/15 via-warning/5 to-transparent px-3 py-1.5 shadow-[var(--shadow-soft)]">
      <Star className="size-4 fill-warning text-warning" />
      <span className="text-lg font-bold leading-none text-snow tabular-nums">
        {display}
        {hasScore && <span className="text-[10px] font-medium text-faint">/10</span>}
      </span>
      {malScore && !hasScore && (
        <span className="text-[10px] uppercase tracking-wider text-faint">MAL</span>
      )}
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────── */

export default function CinematicInfo({ anime, category, epNum }: CinematicInfoProps) {
  const synonyms = useMemo(
    () => [anime.jname, anime.ename].filter(Boolean) as string[],
    [anime.jname, anime.ename],
  );
  const premiered = useMemo(() => {
    const parts: string[] = [];
    if (anime.season) parts.push(anime.season);
    if (anime.year) parts.push(String(anime.year));
    return parts.join(" ") || "—";
  }, [anime.season, anime.year]);
  const episodesValue = formatEpisodes(anime.episodes);
  const durationValue = formatDuration(anime.duration);
  const studio = anime.studios?.[0] ?? "—";
  const type = anime.type ?? "TV";
  const genres = anime.genres ?? [];
  const status = anime.status ?? "";

  return (
    <section className="laser-frame glass relative mt-6 overflow-hidden rounded-md bg-transparent">
      {/* ── Subtle top hairline accent (no backdrop) ─────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-frost/30 to-transparent"
      />

      {/* ── Hero header (eyebrow + status) ─────────────────────── */}
      <div className="reveal flex items-center justify-between border-b border-line/40 px-5 py-3 sm:px-6">
        <span className="frost-eyebrow">
          <Sparkles className="size-3" />
          Now Streaming
        </span>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-faint">
          <span className="font-accent">
            {category.toUpperCase()} · EP {epNum}
          </span>
          {status && <StatusBadge status={status} />}
        </div>
      </div>

      {/* ── Main grid: poster / content / stat rail ────────────── */}
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[180px_1fr] md:gap-7 lg:grid-cols-[180px_1fr_220px]">
        {/* ── LEFT: Premium poster ───────────────────────────── */}
        <div className="reveal flex justify-center md:justify-start" style={revealDelay(60)}>
          <div className="group/poster relative w-[180px]">
            {/* Glass frame with poster inside */}
            <div className="poster-float relative">
              {/* The poster is a tilt surface: it leans toward the cursor with a
                  spring and settles home on leave, and the hover lift is part
                  of the same Motion transform (the frame used to carry a CSS
                  `-translate-y-1`, which would have re-interpolated every frame
                  Motion wrote). Touch and reduced-motion get the previous
                  static poster. */}
              <TiltCard
                maxTilt={5}
                hoverScale={1.01}
                liftY={-4}
                perspective={640}
                className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-line/60 bg-surface/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-white/5 group-hover/poster:shadow-[0_30px_80px_-20px_color-mix(in_oklch,var(--color-frost-deep)_40%,transparent)]"
              >
                {anime.poster ? (
                  <Image
                    src={anime.poster}
                    alt={anime.title}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 768px) 160px, 180px"
                    quality={85}
                    className="object-cover transition-transform duration-700 group-hover/poster:scale-[1.03]"
                  />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center bg-surface-2 text-xs text-faint">
                    No poster
                  </div>
                )}
                {/* Top sheen */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/8 to-transparent" />
                {/* Bottom edge glow */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-frost/10 to-transparent" />
              </TiltCard>
            </div>
          </div>
        </div>

        {/* ── CENTER: Title + content ───────────────────────── */}
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* Eyebrow + title + alt + rating badge */}
          <div className="space-y-1.5">
            <div className="title-rise" style={revealDelay(120)}>
              <span className="frost-eyebrow mb-2">
                <Award className="size-3" />
                {type} · {premiered}
              </span>
              <h3 className="text-display text-balance text-snow">
                {anime.title}
              </h3>
              {synonyms.length > 0 && (
                <p className="mt-1.5 text-sm italic text-faint">
                  {synonyms.join(" · ")}
                </p>
              )}
            </div>

            <div
              className="title-rise flex flex-wrap items-center gap-2 pt-1"
              style={revealDelay(200)}
            >
              <RatingBadge score={anime.score} malScore={anime.malScore} />
              {anime.rating && (
                <span className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
                  {anime.rating}
                </span>
              )}
            </div>
          </div>

          {/* Quick metadata chip strip */}
          <div
            className="title-rise flex flex-wrap gap-1.5"
            style={revealDelay(260)}
          >
            <MetaChip icon={Film}>{type}</MetaChip>
            <MetaChip icon={Calendar}>{premiered}</MetaChip>
          </div>

          {/* Genres — premium glass pills */}
          {genres.length > 0 && (
            <div
              className="title-rise flex flex-wrap gap-1.5"
              style={revealDelay(320)}
            >
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="genre-pill rounded-[var(--radius-btn)] border border-frost/25 bg-gradient-to-br from-frost/15 to-frost/5 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-frost shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:border-frost/60 hover:from-frost/25 hover:to-frost/10"
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Description with Read More */}
          {anime.description && (
            <div
              className="title-rise"
              style={revealDelay(380)}
            >
              <ReadMore text={anime.description} />
            </div>
          )}

          {/* Action buttons — H6 fix: now actually wired. Watchlist calls
           toggleList(), Share copies the URL (with a toast), Completed
           marks the title done in localStorage. State syncs via the
           same `WATCHLIST_EVENT` the Spotlight MyListButton listens to. */}
          <ActionButtons anime={anime} />
        </div>

        {/* ── RIGHT: Floating stat rail ────────────────────── */}
        <div
          className="title-rise flex flex-col gap-2 md:col-span-2 md:grid md:grid-cols-2 lg:col-span-1 lg:flex lg:flex-col"
          style={revealDelay(180)}
        >
          <StatCard
            icon={Star}
            label={anime.malScore ? "MAL Score" : "Score"}
            value={
              typeof anime.score === "number" && anime.score > 0
                ? `${anime.score.toFixed(1)} / 10`
                : anime.malScore ?? "—"
            }
            accent="gold"
          />
          <StatCard icon={Tv} label="Episodes" value={episodesValue} />
          <StatCard icon={Clock} label="Duration" value={durationValue} />
          <StatCard
            icon={Calendar}
            label="Aired"
            value={anime.aired ?? "—"}
          />
          {anime.status && (
            <StatCard
              icon={Activity}
              label="Status"
              value={anime.status}
              accent={
                /finished|completed|ended/i.test(anime.status)
                  ? "success"
                  : /airing|ongoing/i.test(anime.status)
                    ? "frost"
                    : "muted"
              }
            />
          )}
          {anime.jname && (
            <StatCard
              icon={Languages}
              label="Japanese"
              value={anime.jname}
            />
          )}
          <StatCard
            icon={Building2}
            label="Studio"
            value={studio === "—" ? "—" : studio}
            // Compact for long studio names
          />
        </div>
      </div>

      {/* Bottom edge frost line */}
      <div
        aria-hidden
        className="pointer-events-none h-px bg-gradient-to-r from-transparent via-frost/30 to-transparent"
      />
    </section>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line/50 bg-surface/60 px-2.5 py-1.5 text-[12px] font-medium text-snow transition-colors hover:border-frost/30 hover:bg-surface-2/50">
      <Icon className="size-3.5 text-frost" />
      {children}
    </span>
  );
}

/* ── Action buttons (H6 fix) ─────────────────────────────────────────────── */

function ActionButtons({
  anime,
}: {
  anime: Pick<CinematicAnime, "id" | "title" | "poster" | "type">;
}) {
  // H6 fix: wire up the Watchlist / Share / Completed buttons. The same
  // toggleList utility the Spotlight MyListButton uses; sync via the
  // existing WATCHLIST_EVENT so the two stay consistent.
  const [inList, setInList] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setInList(isInListLocal(anime.id));
      setDone(isCompleted(anime.id));
    };
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener(COMPLETED_EVENT, sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener(COMPLETED_EVENT, sync);
    };
  }, [anime.id]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <>
      <div
        className="title-rise flex flex-wrap gap-2 pt-1"
        style={revealDelay(440)}
      >
        <button
          type="button"
          onClick={() => {
            const added = toggleList({
              id: anime.id,
              title: anime.title,
              poster: anime.poster ?? null,
              type: anime.type ?? null,
            });
            flashToast(added ? "Added to Watchlist" : "Removed from Watchlist");
          }}
          aria-pressed={inList}
          className={cn(
            "press text-btn group inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-btn)] border px-3.5 transition-colors duration-300",
            inList
              ? "border-frost/70 bg-frost/30 text-snow"
              : "border-frost/40 bg-gradient-to-br from-frost/20 to-frost/5 text-frost hover:border-frost/70 hover:from-frost/30 hover:to-frost/10",
          )}
        >
          {inList ? <Check className="size-3.5" /> : <Plus className="size-3.5 transition-transform group-hover:rotate-90" />}
          {inList ? "In Watchlist" : "Watchlist"}
        </button>
        <button
          type="button"
          onClick={async () => {
            const url =
              typeof window !== "undefined"
                ? `${window.location.origin}/anime/${anime.id}`
                : `/anime/${anime.id}`;
            try {
              if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: anime.title, url });
                return;
              }
            } catch {
              /* user cancelled */
            }
            try {
              await navigator.clipboard.writeText(url);
              flashToast("Link copied");
            } catch {
              flashToast("Couldn't copy link");
            }
          }}
          className="press text-btn group inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-btn)] border border-line/60 bg-surface/60 px-3.5 text-muted transition-colors duration-300 hover:border-frost/30 hover:bg-surface-2/60 hover:text-snow"
        >
          <Share2 className="size-3.5" />
          Share
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !done;
            setCompleted(anime.id, next);
            setDone(next);
            flashToast(next ? "Marked as completed" : "Marked as in progress");
          }}
          aria-pressed={done}
          className={cn(
            "press text-btn group inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-btn)] border px-3.5 transition-colors duration-300",
            done
              ? "border-success/50 bg-success/15 text-success"
              : "border-line/60 bg-surface/60 text-muted hover:border-success/40 hover:bg-success/10 hover:text-success",
          )}
        >
          <Check className="size-3.5" />
          {done ? "Completed" : "Mark complete"}
        </button>
      </div>
      {/* Tiny toast — sits below the buttons, fades out. Pure UI, no API
       call. Reuses the existing frost palette so the design stays
       consistent. */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="title-rise mt-2 inline-flex items-center gap-2 rounded-sm border border-frost/40 bg-frost-soft px-3 py-1.5 text-xs font-semibold text-frost"
        >
          {toast}
        </div>
      )}
    </>
  );
}