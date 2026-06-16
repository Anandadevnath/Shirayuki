import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Calendar, Star, Film, Clapperboard } from "lucide-react";
import { getAnime, getEpisodes, safe } from "@/lib/api";
import { EpisodeList } from "@/components/details/EpisodeList";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: a.title,
    description: a.description ?? undefined,
    image: a.poster ?? undefined,
    datePublished: a.year ? String(a.year) : undefined,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Backdrop */}
      <div className="relative -mx-4 -mt-4 h-64 overflow-hidden sm:-mx-6 sm:h-80 lg:-mx-8">
        {a.cover && (
          <Image src={a.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-base/40" />
      </div>

      <div className="relative -mt-32 flex flex-col gap-6 sm:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-line shadow-[var(--shadow-soft)] sm:mx-0 sm:w-52">
          {a.poster && (
            <Image src={a.poster} alt={a.title} fill sizes="208px" className="object-cover" />
          )}
        </div>

        <div className="flex-1 pt-2 sm:pt-28">
          <h1 className="text-2xl font-extrabold sm:text-4xl">{a.title}</h1>
          {a.jname && <p className="mt-1 text-sm text-muted">{a.jname}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            {!!a.score && (
              <span className="flex items-center gap-1 rounded-sm bg-frost-soft px-2 py-1 text-frost">
                <Star className="size-3 text-warning" /> {a.score}
              </span>
            )}
            {a.type && (
              <span className="flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                <Film className="size-3" /> {a.type}
              </span>
            )}
            {a.status && (
              <span className="rounded-sm border border-line px-2 py-1 capitalize">
                {a.status.toLowerCase()}
              </span>
            )}
            {(a.season || a.year) && (
              <span className="flex items-center gap-1 rounded-sm border border-line px-2 py-1 capitalize">
                <Calendar className="size-3" /> {[a.season?.toLowerCase(), a.year].filter(Boolean).join(" ")}
              </span>
            )}
            {a.studios.length > 0 && (
              <span className="flex items-center gap-1 rounded-sm border border-line px-2 py-1">
                <Clapperboard className="size-3" /> {a.studios[0]}
              </span>
            )}
            <EpBadges sub={a.episodes.sub} dub={a.episodes.dub} />
          </div>

          {a.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.genres.map((g) => (
                <Link
                  key={g}
                  href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-sm border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-frost/40 hover:text-frost"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {a.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
              {truncate(a.description, 420)}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={firstEp ? `/watch/${id}/${encodeURIComponent(firstEp)}` : `/watch/${id}`}
              className="flex items-center gap-2 rounded-sm bg-frost px-5 py-2.5 text-sm font-semibold text-base transition-transform hover:scale-[1.03]"
            >
              <Play className="size-4 fill-current" /> Watch now
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Episodes</h2>
        <EpisodeList animeId={id} episodes={episodes} />
      </div>

      {a.recommended.length > 0 && <Rail title="Recommended" items={a.recommended} />}
    </div>
  );
}
