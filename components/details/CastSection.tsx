import { Mic, UserRound } from "lucide-react";
import type { CharacterModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SmartImage } from "@/components/ui/SmartImage";

/** Initials fallback for characters / VAs missing a portrait (common on ONA shorts). */
function AvatarFallback({ label, icon }: { label: string; icon: "role" | "mic" }) {
  return (
    <div className="grid size-14 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-bold uppercase text-faint ring-1 ring-line">
      {icon === "mic" ? (
        <Mic className="size-5" />
      ) : label ? (
        label.slice(0, 2)
      ) : (
        <UserRound className="size-5" />
      )}
    </div>
  );
}

/**
 * Voice actor / cast grid. Each card mirrors the provider's two-face layout:
 * the BILLED CHARACTER (left) over the VOICE ACTOR who dubs them (right),
 * so roles read at a glance. Titles without cast data (short ONAs rarely
 * ship a cast list) render nothing and are skipped.
 */
export function CastSection({
  characters,
  charactersTotal,
}: {
  characters: CharacterModel[];
  charactersTotal?: number;
}) {
  if (!characters?.length) return null;

  return (
    <section>
      <SectionHeader
        title={
          charactersTotal && charactersTotal > characters.length
            ? `Voice Actors (${charactersTotal})`
            : "Voice Actors"
        }
        eyebrow="Cast"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {characters.map((c) => {
          const va = c.voiceActor;
          return (
            <article
              key={`${c.id ?? c.name}-${va?.id ?? ""}`}
              className="glass relative overflow-hidden rounded-xl p-3"
            >
              {/* Character face */}
              <div className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md ring-1 ring-line">
                  {c.poster ? (
                    <SmartImage
                      src={c.poster}
                      alt={c.name ?? "Character"}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback label={c.name ?? ""} icon="role" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-snow">{c.name}</p>
                  {c.role && (
                    <span className="mt-0.5 inline-block rounded-sm bg-frost-soft px-1.5 py-0.5 text-[10px] font-semibold text-frost">
                      {c.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Voice actor */}
              {va && (
                <div className="mt-3 flex items-center gap-3 border-t border-line/50 pt-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md ring-1 ring-line">
                    {va.poster ? (
                      <SmartImage
                        src={va.poster}
                        alt={va.name ?? "Voice actor"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback label="" icon="mic" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-snow">{va.name}</p>
                    {va.language && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <Mic className="size-3" /> {va.language}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
