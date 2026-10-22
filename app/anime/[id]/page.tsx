import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getAnime,
  getEpisodes,
  getAnimeSeasons,
  getAnimeArt,
  safe,
} from "@/lib/api";
import { DetailBackdrop } from "@/components/details/DetailBackdrop";
import { HeroSection } from "@/components/details/HeroSection";
import { DetailsInfo } from "@/components/details/DetailsInfo";
import { NextEpisodeSection } from "@/components/details/NextEpisodeSection";
import { EpisodeExplorer } from "@/components/details/EpisodeExplorer";
import { CharacterCarousel } from "@/components/details/CharacterCarousel";
import { VoiceActorRail } from "@/components/details/VoiceActorRail";
import { FranchiseTimeline } from "@/components/details/FranchiseTimeline";
import { DiscoverySections } from "@/components/details/DiscoverySections";
import { truncate } from "@/lib/utils/format";
import { jsonLdHtml } from "@/lib/utils/jsonld";
import { isAiringStatus, yearFromAired } from "@/lib/utils/detail";
import { Skeleton } from "@/components/ui/Skeleton";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const res = await safe(() => getAnime(id));
  if (!res.ok || !res.data) return { title: "Anime" };
  const a = res.data;
  return {
    title: a.title,
    description: a.description ? truncate(a.description, 160) : undefined,
    openGraph: {
      title: a.title,
      description: a.description ? truncate(a.description, 160) : undefined,
      images: a.poster ? [a.poster] : undefined,
    },
  };
}

export default async function AnimePage({ params }: Params) {
  const { id } = await params;

  // Phase 1 — every call is independent and none blocks on the schedule.
  // `getAnime` is the only REQUIRED call (notFound on failure); the rest are
  // optional sections that hide gracefully on failure.
  const [detailRes, epRes, seasonsRes, artRes] = await Promise.all([
    safe(() => getAnime(id)),
    safe(() => getEpisodes(id)),
    safe(() => getAnimeSeasons(id)),
    safe(() => getAnimeArt(id)),
  ]);

  if (!detailRes.ok || !detailRes.data) notFound();
  const a = detailRes.data;
  const episodes = epRes.ok ? epRes.data.episodes : [];
  const firstEpisode = episodes[0] ?? null;
  const seasons = seasonsRes.ok ? seasonsRes.data?.filter(Boolean) ?? [] : [];
  const art = artRes.ok && artRes.data ? artRes.data : null;

  // The "Next episode" card is a streamed island (see NextEpisodeSection): the
  // heavy schedule scrape must never block the page's first paint, so it is
  // only rendered for airing titles and its 8s-capped await lives inside a
  // `<Suspense>` boundary below. Completed/upcoming titles skip it entirely.
  const airing = isAiringStatus(a.status);

  const year = yearFromAired(a.aired);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: a.title,
    description: a.description ?? undefined,
    image: a.poster ?? undefined,
    datePublished: year ?? undefined,
  };

  // HiAnime currently serves cover === poster. Preferring cover keeps the
  // backdrop contract identical to the data model and lets us upgrade to
  // proper banner art without touching this file.
  const backgroundSrc = a.cover ?? a.poster ?? null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />

      {/* The single fixed artwork layer for the whole page. No section
          introduces a second background image or scrim stack. */}
      <DetailBackdrop src={backgroundSrc} />

      {/* Hero + info sidecar share one row: poster/title/actions on the left,
          the compact "Anime Info" panel beside it on desktop (stacked on
          mobile) — the page's original detail layout. The streamed
          "Next episode" strip sits at the top of the sidecar as current-state
          context (its schedule scrape streams in, never blocking first paint). */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <HeroSection anime={a} animeId={id} firstEpisode={firstEpisode} />
        <DetailsInfo
          anime={a}
          staff={art?.staff}
          company={art?.company}
          nextEpisode={
            airing ? (
              <Suspense fallback={<NextEpisodeSkeleton />}>
                <NextEpisodeSection animeId={id} />
              </Suspense>
            ) : null
          }
        />
      </div>

      <div className="section-stack mt-[var(--space-section)]">
        {episodes.length > 0 && <EpisodeExplorer animeId={id} episodes={episodes} />}

        {art && art.characters.length > 0 && (
          <CharacterCarousel
            characters={art.characters}
            charactersTotal={art.charactersTotal}
          />
        )}

        {art && art.voiceActors.length > 0 && (
          <VoiceActorRail voiceActors={art.voiceActors} />
        )}

        {seasons.length > 1 && <FranchiseTimeline items={seasons} currentId={id} />}

        {/* Discovery rails — schedule-derived (Trending + Ongoing), shown only
            for airing titles since that is when the schedule is fetched. The
            island's `getSchedule()` call dedupes with NextEpisodeSection's via
            React cache(), so the page still costs one schedule scrape. Streamed
            behind Suspense so it never blocks first paint. */}
        {airing && (
          <Suspense fallback={<DiscoverySkeleton />}>
            <DiscoverySections animeId={id} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

/** Placeholder matching NextEpisodeCard's footprint while the schedule
 *  streams in, so the strip's arrival causes no layout shift. */
function NextEpisodeSkeleton() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-sm border border-frost/25 bg-frost-soft/50 px-3 py-2.5">
      <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded-sm" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

/** Placeholder for the streamed discovery rails — matches a rail's header +
 *  poster row so the arrival causes no layout shift. */
function DiscoverySkeleton() {
  return (
    <>
      {["Trending", "Ongoing"].map((label) => (
        <section key={label}>
          <div className="mb-4 flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex gap-4 overflow-hidden pt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] w-44 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line sm:w-52 md:w-56"
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
