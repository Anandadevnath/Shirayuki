import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { PortalSectionHeader } from "./PortalSectionHeader";
import { cn } from "@/lib/utils/cn";

/**
 * "Latest Episodes" — the reference's left glass panel: four episode cards in
 * a row, each a 16:9 thumbnail with a play affordance bottom-left, a "New"
 * badge bottom-right, and the anime title + compact episode/date metadata in
 * the band beneath.
 */
export function LatestEpisodesPanel({ items }: { items: AnimeCardModel[] }) {
  const cards = items.slice(0, 4);
  if (!cards.length) return null;

  return (
    <section
      aria-label="Latest episodes"
      className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5"
    >
      <PortalSectionHeader jp="最新のエピソード" title="Latest Episodes" href="/schedule" className="mb-4" />

      <div className="grid grid-cols-2 gap-3 min-[480px]:gap-4 sm:grid-cols-4">
        {cards.map((a) => {
          const epNum = a.episodeNumber;
          return (
            <Link
              key={a.id}
              href={`/watch/${a.id}`}
              aria-label={`Watch the latest episode of ${a.title}`}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg border border-line/70 bg-surface-2">
                {a.poster && (
                  <SmartImage
                    src={a.poster}
                    alt=""
                    fill
                    sizes="(max-width:640px) 45vw, 240px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                )}
                {/* Play affordance, bottom-left, as in the reference. */}
                <span
                  aria-hidden
                  className="absolute bottom-1.5 left-1.5 grid size-7 place-items-center rounded-full border border-white/20 bg-black/45 text-snow backdrop-blur-sm transition-[background-color,transform] duration-200 group-hover:scale-110 group-hover:bg-frost/30"
                >
                  <Play className="size-3 fill-current" />
                </span>
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-frost px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-[#06101E]">
                  New
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
                />
              </div>
              <h3 className="mt-2 truncate text-[13.5px] font-semibold text-snow transition-colors group-hover:text-frost">
                {a.title}
              </h3>
              <p className="mt-0.5 truncate text-[11.5px] text-muted">
                {a.type ?? "TV"}
                {epNum ? ` · E${epNum}` : ""} · Today
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * "Seasonal Picks" — the reference's right glass panel: one tall featured
 * artwork on the left with title/rating overlay and a white Watch chip, and
 * three compact recommendation rows stacked on the right.
 */
export function SeasonalPicksPanel({ items }: { items: AnimeCardModel[] }) {
  const cards = items.slice(0, 4);
  const featured = cards[0];
  const rows = cards.slice(1, 4);
  if (!featured) return null;

  return (
    <section
      aria-label="Seasonal picks"
      className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5"
    >
      <PortalSectionHeader jp="今シーズンのおすすめ" title="Seasonal Picks" href="/category/top-airing" className="mb-4" />

      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ── Featured artwork card ── */}
        <Link
          href={`/watch/${featured.id}`}
          aria-label={`Watch ${featured.title}`}
          className="group relative block overflow-hidden rounded-xl border border-line/70 bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
        >
          <div className={cn("relative", rows.length ? "aspect-[4/3] min-h-[180px]" : "aspect-[3/4]")}>
            {featured.poster && (
              <SmartImage
                src={featured.poster}
                alt=""
                fill
                sizes="(max-width:640px) 90vw, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <h3 className="font-display truncate text-lg font-semibold text-snow">
                {featured.title}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-snow/85">
                {!!featured.score && (
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="size-3 fill-warning text-warning" /> {featured.score}
                  </span>
                )}
                {(featured.episodes.sub ?? featured.episodes.dub ?? 0) > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{featured.episodes.sub ?? featured.episodes.dub} eps</span>
                  </>
                )}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-snow px-3.5 py-1.5 text-[11px] font-bold text-[#06101E]">
                <Play className="size-3 fill-current" /> Watch Now
              </span>
            </div>
          </div>
        </Link>

        {/* ── Recommendation rows ── */}
        {rows.length > 0 && (
          <ul className="flex min-w-0 flex-col gap-2.5">
            {rows.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/anime/${a.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-line/50 bg-base/40 p-2 transition-[border-color,background-color] hover:border-frost/40 hover:bg-frost-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
                >
                  <span className="relative block h-[52px] w-[70px] shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {a.poster && (
                      <SmartImage
                        src={a.poster}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-snow transition-colors group-hover:text-frost">
                      {a.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                      {!!a.score && (
                        <span className="flex items-center gap-1 text-snow/85">
                          <Star className="size-3 fill-warning text-warning" /> {a.score}
                        </span>
                      )}
                      {(a.episodes.sub ?? a.episodes.dub ?? 0) > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span>{a.episodes.sub ?? a.episodes.dub} eps</span>
                        </>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
