import { getHome, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Rail } from "@/components/anime/Rail";
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
    <div className="space-y-2">
      {home.spotlight.length > 0 && <Spotlight items={home.spotlight} />}
      <ContinueWatching />
      <Rail title="Trending" items={home.trending} href="/category/most-popular" />
      <Rail title="Top Airing" items={home.topAiring} href="/category/top-airing" />
      <Rail title="Latest Episodes" items={home.latestEpisodes} />
      <Rail title="Most Popular" items={home.mostPopular} href="/category/most-popular" />
      <Rail title="Top 10" items={home.top10} />
      <Rail title="Upcoming" items={home.upcoming} />
    </div>
  );
}
