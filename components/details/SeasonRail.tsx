import Link from "next/link";
import { Play } from "lucide-react";
import type { SeasonModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { TypePill } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

export function SeasonRail({
  title = "Seasons",
  items,
  currentId,
}: {
  title?: string;
  items: SeasonModel[];
  currentId?: string;
}) {
  if (!items?.length) return null;

  // Sort by `order` so the provider can reorder without breaking the UI; fall
  // back to season+part as a deterministic secondary key.
  const ordered = [...items].sort((a, b) => {
    const ao = a.order ?? (a.season ?? 0) * 10 + (a.part ?? 0);
    const bo = b.order ?? (b.season ?? 0) * 10 + (b.part ?? 0);
    return ao - bo;
  });

  return (
    <RailShell title={title} eyebrow="Franchise">
      {ordered.map((s, i) => {
        const isCurrent = s.isCurrent || s.id === currentId;
        return (
          <Link
            key={s.id}
            href={`/anime/${s.id}`}
            style={{ ["--reveal-delay" as string]: `${Math.min(i, 9) * 60}ms` }}
            className="reveal group block w-[44vw] shrink-0 snap-start sm:w-[24vw] md:w-[200px]"
          >
            <div
              className={cn(
                "relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2 ring-1 transition-all duration-300 ease-out",
                isCurrent
                  ? "ring-frost shadow-[var(--shadow-frost)]"
                  : "ring-line group-hover:-translate-y-1 group-hover:ring-frost/40 group-hover:shadow-[var(--shadow-frost)]",
              )}
            >
              {s.poster ? (
                <SmartImage
                  src={s.poster}
                  alt={s.title}
                  fill
                  sizes="(max-width:640px) 40vw, (max-width:1024px) 22vw, 180px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              ) : (
                <div className="grid h-full place-items-center text-faint">No image</div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/30 to-base/0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

              {isCurrent && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-frost/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-base shadow-[var(--shadow-neon)]">
                  <Play className="size-2.5 fill-current" /> Current
                </span>
              )}

              {s.year && (
                <span className="absolute right-2 top-2 rounded-md bg-base/80 px-1.5 py-0.5 text-[10px] font-bold text-snow backdrop-blur">
                  {s.year}
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-snow drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
                  {s.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                  {s.type && <TypePill type={s.type} />}
                  {(s.episodes.sub ?? s.episodes.dub) != null && (
                    <span className="rounded-sm bg-base/70 px-1.5 py-0.5 text-snow">
                      {s.episodes.sub ?? s.episodes.dub} eps
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </RailShell>
  );
}