import { getHome, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Rail } from "@/components/anime/Rail";
import { Trending } from "@/components/home/Trending";
import { QuickLists } from "@/components/home/QuickLists";
import { DiscoverColumns } from "@/components/home/DiscoverColumns";
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
        <Spotlight items={home.spotlight} />
      )}

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-screen -translate-x-1/2 bg-gradient-to-b from-base from-5% via-base/55 via-45% to-transparent"
        />

        <div className="relative z-10 flex flex-col gap-12 -translate-y-[8vh] sm:-translate-y-[16vh]">
          <ContinueWatching />

        <Trending items={home.trending} />

        {/* Card rails first — posters get room to breathe */}
        <Rail title="Latest Episodes" eyebrow="Just aired" items={home.latestEpisodes} />

        <DiscoverColumns
          topAiring={home.topAiring}
          mostPopular={home.mostPopular}
          newReleases={home.newReleases}
          completed={home.completed}
        />

        <QuickLists
          newReleases={home.newReleases}
          completed={home.completed}
          upcoming={home.upcoming}
        />
        </div>
      </div>
    </div>
  );
}
