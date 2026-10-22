import { Mic, UserRound } from "lucide-react";
import type { VoiceActorProfileModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";

/**
 * Voice Actors rail — the person-first counterpart to `CharacterCarousel`
 * (which is character-first, revealing the VA on hover). Here each card is the
 * VA: portrait, name, language, and the character(s) they voice on the title.
 *
 * The character list is revealed on hover/focus on fine pointers and rests
 * visible on touch + reduced motion — the same `[@media(pointer:coarse)]` +
 * `motion-reduce:` pattern the character cards and AnimeCard use. A VA can
 * voice several characters, so the list can carry more than one name.
 *
 * Server-rendered through the shared `RailShell` (masked scroll + chevrons),
 * so no per-card JS. Hidden by the page when the bundle has no VAs.
 */
function Portrait({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[0.5rem] bg-surface-2 ring-1 ring-line">
      {src ? (
        <SmartImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width:640px) 40vw, 180px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-faint">
          <UserRound className="size-6" />
        </div>
      )}
    </div>
  );
}

export function VoiceActorRail({ voiceActors }: { voiceActors: VoiceActorProfileModel[] }) {
  if (!voiceActors.length) return null;

  return (
    <RailShell title="Voice Actors" eyebrow="Cast">
      {voiceActors.map((va, i) => {
        const names = va.characters
          .map((c) => c.name)
          .filter((n): n is string => !!n);
        return (
          <article
            key={va.id ?? va.name ?? i}
            className="group w-36 shrink-0 snap-start sm:w-40"
          >
            <div className="relative transform-gpu transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-within:-translate-y-1">
              <Portrait src={va.poster} alt={va.name ?? "Voice actor"} />

              {/* Bottom scrim carries name + language + roles */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 rounded-b-[0.5rem] bg-gradient-to-t from-base via-base/60 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <h3 className="text-title line-clamp-1 text-[13px] text-snow [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                  {va.name ?? "Unknown"}
                </h3>

                {va.language && (
                  <span className="mt-1 inline-block rounded-sm bg-frost-soft px-1.5 py-0.5 text-[10px] font-semibold text-frost">
                    {va.language}
                  </span>
                )}

                {names.length > 0 && (
                  <div
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted opacity-0 transition-opacity duration-300",
                      "group-hover:opacity-100 group-focus-within:opacity-100",
                      "[@media(pointer:coarse)]:opacity-100 motion-reduce:opacity-100",
                    )}
                  >
                    <Mic className="size-3 shrink-0 text-faint" />
                    <span className="line-clamp-1">{names.join(" / ")}</span>
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
    </RailShell>
  );
}
