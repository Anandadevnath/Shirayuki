import Link from "next/link";
import { Building2, Calendar, Clapperboard, Film, Timer } from "lucide-react";
import type { AnimeDetail, StaffCredit } from "@/lib/providers/types";
import { slugify } from "@/lib/utils/format";
import { formatDuration, yearFromAired } from "@/lib/utils/detail";

type Field = { label: string; value: React.ReactNode };

function Row({ label, value }: Field) {
  return (
    <div className="flex gap-3 text-xs">
      <dt className="w-20 shrink-0 pt-px text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-snow">{value}</dd>
    </div>
  );
}

function Icon({ icon: Icon, children }: { icon: typeof Film; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3 shrink-0 text-faint" />
      {children}
    </span>
  );
}

/**
 * Compact "Anime Info" sidecar for the detail hero — sits BESIDE the poster +
 * copy column (a right-hand aside on desktop, stacked on mobile), matching the
 * page's original two-column arrangement. Only fields that actually exist
 * render; nothing is fabricated.
 */
export function DetailsInfo({
  anime,
  staff,
  company,
  nextEpisode,
}: {
  anime: AnimeDetail;
  staff?: StaffCredit[];
  company?: StaffCredit | null;
  /** Optional "Next episode" strip, streamed in via a Suspense boundary and
   *  rendered at the top of the sidecar as current-state context. */
  nextEpisode?: React.ReactNode;
}) {
  const year = yearFromAired(anime.aired);
  const duration = formatDuration(anime.duration);

  const info: Field[] = [];
  if (anime.jname && anime.jname !== anime.title)
    info.push({ label: "Japanese", value: <span lang="ja">{anime.jname}</span> });
  else if (anime.ename && anime.ename !== anime.title)
    info.push({ label: "English", value: anime.ename });
  if (anime.type) info.push({ label: "Type", value: <Icon icon={Film}>{anime.type}</Icon> });
  if (anime.aired)
    info.push({ label: "Aired", value: <Icon icon={Calendar}>{anime.aired}</Icon> });
  else if (year) info.push({ label: "Year", value: year });
  if (duration) info.push({ label: "Duration", value: <Icon icon={Timer}>{duration}</Icon> });
  if (anime.status) info.push({ label: "Status", value: anime.status });

  const epValue =
    anime.episodes.sub != null || anime.episodes.dub != null
      ? `${anime.episodes.sub ?? "?"} sub / ${anime.episodes.dub ?? "?"} dub`
      : null;
  if (epValue) info.push({ label: "Episodes", value: epValue });

  if (anime.studios.length)
    info.push({
      label: "Studio",
      value: <Icon icon={Clapperboard}>{anime.studios.join(", ")}</Icon>,
    });

  // Producers: prefer the detail payload names; fall back to the /art credits.
  const producerNames = anime.producers.length
    ? anime.producers
    : (staff ?? []).filter((s) => s.kind === "producer").map((s) => s.name);
  const prodList = [...producerNames];
  if (company && !prodList.includes(company.name)) prodList.push(company.name);
  if (prodList.length)
    info.push({
      label: "Producers",
      value: <Icon icon={Building2}>{prodList.join(", ")}</Icon>,
    });

  return (
    <aside className="glass relative h-full overflow-hidden rounded-md p-5 sm:p-6">
      <h2 className="text-eyebrow mb-4 text-frost">Anime Info</h2>

      {nextEpisode}

      <dl className="space-y-2.5">
        {info.map((f) => (
          <Row key={f.label} {...f} />
        ))}
      </dl>

      {anime.genres.length > 0 && (
        <div className="mt-5 border-t border-line/60 pt-4">
          <h3 className="text-eyebrow mb-2.5 text-frost">Genres</h3>
          <div className="flex flex-wrap gap-1.5">
            {anime.genres.map((g) => (
              <Link
                key={g}
                href={`/genre/${slugify(g)}`}
                className="rounded-sm border border-line bg-surface/50 px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-frost/40 hover:text-frost"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

