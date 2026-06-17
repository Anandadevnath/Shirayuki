import type { AnimeCardModel } from "@/lib/providers/types";
import { Rail } from "@/components/anime/Rail";

/**
 * New releases / completed / upcoming as card rails. Rails (rather than the
 * compact numbered panels) give the lower half of the home page visual variety
 * and let the poster art breathe, matching the reference streaming layouts.
 * Each rail hides when empty; the whole block disappears if nothing has data.
 */
export function QuickLists({
  newReleases,
  completed,
  upcoming,
}: {
  newReleases: AnimeCardModel[];
  completed: AnimeCardModel[];
  upcoming: AnimeCardModel[];
}) {
  const rails = [
    { title: "New Releases", eyebrow: "Fresh", items: newReleases, href: "/category/recently-added" },
    { title: "Latest Completed", eyebrow: "Finished", items: completed, href: "/category/completed" },
    { title: "Upcoming", eyebrow: "Soon", items: upcoming, href: "/category/top-upcoming" },
  ].filter((c) => c.items.length > 0);

  if (!rails.length) return null;

  return (
    <div className="space-y-12">
      {rails.map((c) => (
        <Rail key={c.title} title={c.title} eyebrow={c.eyebrow} items={c.items} href={c.href} />
      ))}
    </div>
  );
}
