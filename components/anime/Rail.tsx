import type { AnimeCardModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { AnimeCard } from "./AnimeCard";

export function Rail({
  title,
  eyebrow,
  items,
  href,
}: {
  title: string;
  eyebrow?: string;
  items: AnimeCardModel[];
  href?: string;
}) {
  if (!items?.length) return null;

  return (
    <RailShell title={title} eyebrow={eyebrow} href={href}>
      {items.map((a) => (
        // Cards stay VISIBLE from first paint (no <Reveal> hiding wrapper —
        // same reasoning as Grid: an opacity-0 wrapper would blank the rail's
        // poster placeholders for the hydration window and replay a second
        // fade on top of SmartImage's crossfade). The fixed-width layout slot
        // now lives on a plain wrapper div so the track geometry is unchanged.
        //
        // Each wrapper carries `.grid-in`, the same opacity-only one-shot as
        // <Grid>: additive (an animation on an already-visible tree), never a
        // hidden-until-hydrated wrapper. All wrappers mount in one commit, so
        // the fades fire simultaneously and the rail cross-fades as ONE unit
        // with no stagger. `.grid-in` is NOT on RailShell itself — that shell
        // is shared by non-poster rails (ArtGallery, FranchiseTimeline,
        // CharacterCarousel, VoiceActorRail), which must not inherit the fade.
        <div
          key={`${a.id}-${a.episodeNumber ?? ""}`}
          className="grid-in w-[44vw] shrink-0 snap-start sm:w-[24vw] md:w-[200px]"
        >
          <AnimeCard anime={a} />
        </div>
      ))}
    </RailShell>
  );
}