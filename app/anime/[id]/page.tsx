import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Film, Clapperboard } from "lucide-react";
import { getAnime, getEpisodes, safe } from "@/lib/api";
import { SeasonRail } from "@/components/details/SeasonRail";
import { Rail } from "@/components/anime/Rail";
import { EpBadges } from "@/components/anime/Badges";
import { truncate } from "@/lib/utils/format";

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
  const [detailRes, epRes] = await Promise.all([
    safe(() => getAnime(id)),
    safe(() => getEpisodes(id)),
  ]);

  if (!detailRes.ok || !detailRes.data) notFound();
  const a = detailRes.data;
  const episodes = epRes.ok ? epRes.data.episodes : [];
  const firstEp = episodes[0]?.episodeId;

  const japanese = a.jname;
  const aired = a.aired;
  const premieredYear = a.year ? String(a.year) : null;
  const malScore = a.malScore;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: a.title,
    description: a.description ?? undefined,
    image: a.poster ?? undefined,
    datePublished: a.year ? String(a.year) : undefined,
  };

  // HiAnime currently serves cover === poster. Preferring cover keeps the
  // backdrop contract identical to the data model and lets us upgrade to
  // proper banner art without touching this file.
  const backgroundSrc = a.cover ?? a.poster ?? null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Anime-specific backdrop. Sits between the Ambient layer (-z-10) and
          the page content (z auto) so the art whispers through without
          competing with the panels. */}
      <div className="pointer-events-none fixed inset-0 z-[-5] overflow-hidden">
        {backgroundSrc && (
          <Image
            src={backgroundSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            quality={50}
            className="object-cover opacity-40 blur-2xl saturate-150"
          />
        )}
        <div className="absolute inset-0 bg-base/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-base/40 via-base/60 to-base" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_60%)]" />
      </div>

      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-snow">Home</Link>
        <span>·</span>
        <Link href="/tv" className="transition-colors hover:text-snow">TV</Link>
        <span>·</span>
        <span className="truncate text-snow">{a.title}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Panel 1 — poster, title, badges, description, actions */}
        <section className="glass relative overflow-hidden rounded-2xl p-5 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-line shadow-[var(--shadow-soft)] sm:mx-0 sm:w-52">
              {a.poster && (
                <Image src={a.poster} alt={a.title} fill sizes="208px" className="object-cover" />
              )}
            </div>

            <div className="flex-1 pt-1 sm:pt-0">
              <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-4xl">
                {a.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                {a.rating && (
                  <span className="rounded-sm border border-line bg-surface/60 px-2 py-1 font-semibold text-snow">
                    {a.rating}
                  </span>
                )}
                {malScore && (
                  <span className="rounded-sm bg-frost-soft px-2 py-1 font-semibold text-frost">
                    <span className="font-mono">MAL</span> {malScore}
                  </span>
                )}
                <span className="font-mono text-faint">·</span>
                {a.type && (
                  <span className="flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                    <Film className="size-3" /> {a.type}
                  </span>
                )}
                <span className="font-mono text-faint">·</span>
                {premieredYear && (
                  <span className="rounded-sm border border-line px-2 py-1 font-mono">
                    {premieredYear}
                  </span>
                )}
                <EpBadges sub={a.episodes.sub} dub={a.episodes.dub} />
              </div>

              {a.description && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                  {truncate(a.description, 420)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={firstEp ? `/watch/${id}/${encodeURIComponent(firstEp)}` : `/watch/${id}`}
                  className="flex items-center gap-2 rounded-sm bg-gradient-to-br from-frost to-frost-deep px-5 py-2.5 text-sm font-semibold text-base shadow-[var(--shadow-neon)] transition-transform hover:scale-[1.03]"
                >
                  <Play className="size-4 fill-current" /> Watch now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Panel 2 — anime info sidecar */}
        <aside className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-frost">
            Anime Info
          </h2>

          <dl className="space-y-2.5 text-xs">
            {japanese && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">Japanese</dt>
                <dd className="flex-1 text-snow">{japanese}</dd>
              </div>
            )}
            {aired && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">Aired</dt>
                <dd className="flex-1 text-snow">{aired}</dd>
              </div>
            )}
            {premieredYear && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">Premiered</dt>
                <dd className="flex-1 text-snow">{premieredYear}</dd>
              </div>
            )}
            {a.duration != null && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">Duration</dt>
                <dd className="flex-1 text-snow">{a.duration} min</dd>
              </div>
            )}
            {a.status && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">Status</dt>
                <dd className="flex-1 text-snow">{a.status}</dd>
              </div>
            )}
            {malScore && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-semibold text-muted">MAL Score</dt>
                <dd className="flex-1 font-mono text-snow">{malScore}</dd>
              </div>
            )}
          </dl>

          {a.genres.length > 0 && (
            <div className="mt-5 border-t border-line/60 pt-4">
              <dt className="mb-2 text-xs font-semibold text-muted">Genres</dt>
              <div className="flex flex-wrap gap-1.5">
                {a.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                    className="rounded-sm border border-line bg-surface/50 px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-frost/40 hover:text-frost"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {a.studios.length > 0 && (
            <div className="mt-5 border-t border-line/60 pt-4">
              <dt className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted">
                <Clapperboard className="size-3" /> Studios
              </dt>
              <dd className="text-xs text-snow">{a.studios.join(", ")}</dd>
            </div>
          )}
        </aside>
      </div>

      {a.seasons.length > 0 && (
        <div className="mt-10">
          <SeasonRail items={a.seasons} currentId={a.id} />
        </div>
      )}

      {a.trending.length > 0 && (
        <div className="mt-10">
          <Rail title="Trending" items={a.trending} />
        </div>
      )}

      {a.recommended.length > 0 && (
        <div className="mt-10">
          <Rail title="Recommended" items={a.recommended} />
        </div>
      )}
    </div>
  );
}