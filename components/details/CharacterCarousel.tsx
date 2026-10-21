import { Mic, UserRound } from "lucide-react";
import type { CharacterModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";

/**
 * Deduped cast display. Desktop gets a responsive grid; mobile scrolls a
 * horizontal snap rail — both use the same portrait card, which reveals the
 * voice actor(s) on hover/focus and rests visible on touch / reduced-motion
 * (the exact `[@media(pointer:coarse)]` + `motion-reduce:` pattern AnimeCard
 * uses). Server-rendered — no per-card JS.
 */
function Portrait({ src, alt, fallback }: { src: string | null; alt: string; fallback: "role" | "mic" }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[0.5rem] bg-surface-2 ring-1 ring-line">
      {src ? (
        <SmartImage src={src} alt={alt} fill sizes="(max-width:640px) 40vw, 180px" className="object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-faint">
          {fallback === "mic" ? <Mic className="size-6" /> : <UserRound className="size-6" />}
        </div>
      )}
    </div>
  );
}

export function CharacterCarousel({
  characters,
  charactersTotal,
}: {
  characters: CharacterModel[];
  charactersTotal?: number;
}) {
  if (!characters.length) return null;

  const title =
    charactersTotal && charactersTotal > characters.length
      ? `Characters (${charactersTotal})`
      : "Characters";

  return (
    <section>
      <SectionHeader title={title} eyebrow="Cast" />

      <div className="no-scrollbar -mx-1 flex snap-x-rail gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {characters.map((c, i) => {
          const vas = c.voiceActors ?? (c.voiceActor ? [c.voiceActor] : []);
          const primary = c.voiceActor ?? vas[0] ?? null;
          const extraVas = vas.filter((v) => v !== primary);
          return (
            <article
              key={c.id ?? c.name ?? i}
              className="group relative w-36 shrink-0 snap-start sm:w-auto"
            >
              <div className="relative transform-gpu transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-within:-translate-y-1">
                <Portrait src={c.poster} alt={c.name ?? "Character"} fallback="role" />

                {/* Bottom scrim carries the name + the reveal row */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 rounded-b-[0.5rem] bg-gradient-to-t from-base via-base/60 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <h3 className="text-title line-clamp-1 text-[13px] text-snow [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                    {c.name ?? "Unknown"}
                  </h3>
                  {c.role && (
                    <span className="mt-1 inline-block rounded-sm bg-frost-soft px-1.5 py-0.5 text-[10px] font-semibold text-frost">
                      {c.role}
                    </span>
                  )}

                  {/* VA reveal — hover/focus on fine pointers, rest-visible on
                      touch + reduced motion. */}
                  {primary && (
                    <div
                      className={cn(
                        "mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted opacity-0 transition-opacity duration-300",
                        "group-hover:opacity-100 group-focus-within:opacity-100",
                        "[@media(pointer:coarse)]:opacity-100 motion-reduce:opacity-100",
                      )}
                    >
                      <Mic className="size-3 shrink-0 text-faint" />
                      <span className="line-clamp-1">
                        {[primary.name, ...extraVas.map((v) => v.name)].filter(Boolean).join(" / ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Frost focus ring */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[0.5rem] ring-1 ring-frost/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                />
              </div>
            </article>
          );
        })}
      </div>

      {charactersTotal && charactersTotal > characters.length && (
        <p className="text-caption mt-2 text-faint">
          Showing {characters.length} of {charactersTotal} billed characters.
        </p>
      )}
    </section>
  );
}
