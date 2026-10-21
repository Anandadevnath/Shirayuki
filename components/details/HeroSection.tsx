import Link from "next/link";
import { Calendar, Clock, Film, Play, Star } from "lucide-react";
import type { AnimeDetail, EpisodeModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { TiltCard } from "@/components/motion/TiltCard";
import { EpBadges } from "@/components/anime/Badges";
import { slugify } from "@/lib/utils/format";
import { formatDuration, yearFromAired, isUnreleased } from "@/lib/utils/detail";
import { HeroActions } from "./HeroActions";
import { ReadMore } from "./ReadMore";

/**
 * Detail-page opener: identity first. A supporting poster (tilt surface) beside
 * a copy column carrying the title, alternate titles, a compact metadata row,
 * genre chips, the expandable synopsis and the action row.
 *
 * No background image and no scrim live here — the page's single
 * `DetailBackdrop` is the only artwork layer, so this section is transparent
 * and its bottom edge meets the page `base` with no seam.
 */
export function HeroSection({
  anime,
  animeId,
  firstEpisode,
}: {
  anime: AnimeDetail;
  animeId: string;
  /** First episode when the list is non-empty — lets "Watch now" skip the
   *  `/watch/{id}` redirect hop by linking the episode directly. */
  firstEpisode: EpisodeModel | null;
}) {
  const year = yearFromAired(anime.aired);
  const duration = formatDuration(anime.duration);
  const unreleased = isUnreleased(anime.status);
  const canWatch = !unreleased && firstEpisode != null;
  const watchHref = firstEpisode
    ? `/watch/${animeId}/${encodeURIComponent(firstEpisode.episodeId)}`
    : `/watch/${animeId}`;
  const altTitles = [anime.jname, anime.ename].filter(
    (s, i, arr): s is string => !!s && s !== anime.title && arr.indexOf(s) === i,
  );

  return (
    <section>
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-snow">
          Home
        </Link>
        <span aria-hidden>·</span>
        {anime.type && (
          <>
            <Link
              href={`/category/${slugify(anime.type)}`}
              className="transition-colors hover:text-snow"
            >
              {anime.type}
            </Link>
            <span aria-hidden>·</span>
          </>
        )}
        <span className="truncate text-snow">{anime.title}</span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Supporting poster — the hero's single visual anchor. Priority so it
            wins the LCP preload slot; the backdrop image deliberately does not. */}
        <TiltCard
          maxTilt={5}
          liftY={-4}
          hoverScale={1.01}
          perspective={720}
          className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-[0.5rem] bg-surface-2 ring-1 ring-line shadow-[var(--shadow-soft)] sm:mx-0 sm:w-56"
        >
          {anime.poster ? (
            <SmartImage
              src={anime.poster}
              alt={anime.title}
              fill
              priority
              sizes="(max-width:640px) 40vw, 224px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-faint">No poster</div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/6 to-transparent"
          />
        </TiltCard>

        <div className="min-w-0 flex-1">
          {anime.type && (
            <span className="text-label mb-2 block text-frost">
              {anime.type}
              {year ? ` · ${year}` : ""}
            </span>
          )}

          <h1 className="text-hero text-balance text-snow [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
            {anime.title}
          </h1>

          {altTitles.length > 0 && (
            <p className="mt-2 text-sm italic text-faint">{altTitles.join(" · ")}</p>
          )}

          {/* Compact metadata row — only real, non-fabricated fields render. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-meta text-muted">
            {anime.malScore && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-frost-soft px-2 py-1 font-semibold text-frost">
                <Star className="size-3 fill-current" />
                <span className="font-accent">{anime.malScore}</span>
              </span>
            )}
            {anime.rating && (
              <span className="rounded-sm border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] font-semibold text-warning">
                {anime.rating}
              </span>
            )}
            {anime.type && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                <Film className="size-3" /> {anime.type}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                <Clock className="size-3" /> {duration}
              </span>
            )}
            {anime.aired && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                <Calendar className="size-3" /> {anime.aired}
              </span>
            )}
            <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
            {anime.status && (
              <span className="rounded-sm border border-line/60 bg-surface/50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                {anime.status}
              </span>
            )}
          </div>

          {anime.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  href={`/genre/${slugify(g)}`}
                  className="rounded-[var(--radius-btn)] border border-line bg-surface/50 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-frost/40 hover:text-frost"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {anime.description && (
            <div className="mt-5 max-w-3xl">
              <ReadMore text={anime.description} clamp={4} />
            </div>
          )}

          <div className="group mt-5 flex flex-wrap items-center gap-2.5">
            {canWatch ? (
              <Link
                href={watchHref}
                className="press text-btn inline-flex h-10 items-center gap-2 rounded-[var(--radius-btn)] bg-frost px-5 text-base"
              >
                <Play className="size-4 fill-current" /> Watch now
              </Link>
            ) : unreleased ? (
              <span className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-btn)] border border-warning/30 bg-warning/10 px-4 text-btn text-warning">
                Not yet aired
              </span>
            ) : null}
            <HeroActions
              anime={{
                id: animeId,
                title: anime.title,
                poster: anime.poster,
                type: anime.type,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
