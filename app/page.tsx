import { getHome, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Rail } from "@/components/anime/Rail";
import { RankList } from "@/components/home/RankList";
import { Top10Tabs } from "@/components/home/Top10Tabs";
import { QuickLists } from "@/components/home/QuickLists";
import { GenreCloud } from "@/components/home/GenreCloud";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ErrorState } from "@/components/common/States";

export default async function HomePage() {
  const res = await safe(getHome);

  if (!res.ok) {
    return (
      <div className="pt-10">
        <ErrorState retryHref="/" />
      </div>
    );
  }

  const home = res.data;

  return (
    <div>
      {home.spotlight.length > 0 && (
        <Spotlight items={home.spotlight} trending={home.trending} />
      )}

      <div className="relative">
        {/* Seam blend — carries the hero's flat base down across the section
            boundary and fades it into the page's ambient glow + falling snow,
            so the two section backgrounds merge instead of meeting at a hard
            line. Full-bleed so it spans the same width as the snow/ambient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-screen -translate-x-1/2 bg-gradient-to-b from-base from-5% via-base/55 via-45% to-transparent"
        />

        <div className="relative space-y-12 pt-3 sm:pt-4">
          <ContinueWatching />

        {/* Card rails first — posters get room to breathe */}
        <Rail title="Latest Episodes" eyebrow="Just aired" items={home.latestEpisodes} />

        <QuickLists
          newReleases={home.newReleases}
          completed={home.completed}
          upcoming={home.upcoming}
        />

        {/* Dense ranked lists grouped as a single "charts" block near the end */}
        <section>
          <SectionHeader title="Top Charts" eyebrow="Most watched" />
          <div className="grid gap-4 lg:grid-cols-3">
            <RankList title="Top Airing" items={home.topAiring} href="/category/top-airing" />
            <RankList title="Most Popular" items={home.mostPopular} href="/category/most-popular" />
            <Top10Tabs buckets={home.top10} />
          </div>
        </section>

          <GenreCloud genres={home.genres} />
        </div>
      </div>
    </div>
  );
}
