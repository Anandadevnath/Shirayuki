import { useEffect, useState } from "react";
import { getHome } from "@/context/api";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AnimeGridCard,
  SpotlightSlider,
  AnimeScrollSection,
  Top10Sidebar,
  TopAnimesSidebar,
  GenresSection,
  HomePageSkeleton,
} from "@/components/home";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHomeData() {
      setLoading(true);
      const { data: result, error: err } = await getHome();
      if (err) {
        setError(err);
      } else {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchHomeData();
  }, []);

  if (loading) return <HomePageSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Spotlight Slider */}
      {data?.spotlightAnimes && (
        <SpotlightSlider spotlightAnimes={data.spotlightAnimes} />
      )}

      {/* Main Content */}
      <div className="relative -mt-56 z-10 max-w-[1480px] mx-auto px-8 lg:px-12 py-6">
        {/* Trending */}
        {data?.trendingAnimes && (
          <AnimeScrollSection title="Trending Now" animes={data.trendingAnimes} autoSlide />
        )}

        {/* Top Airing */}
        {data?.topAiringAnimes && (
          <AnimeScrollSection title="🔥 Top Airing" animes={data.topAiringAnimes} />
        )}

        {/* Latest Episodes with Sidebar */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex-1">📺 Latest Episodes</h2>
            <div className="w-[380px] flex-shrink-0 hidden lg:flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-2xl font-bold text-white">Top Trending</h2>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              {data?.latestEpisodeAnimes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.latestEpisodeAnimes.map((anime) => (
                    <AnimeGridCard key={anime.id} anime={anime} />
                  ))}
                </div>
              )}
            </div>

            {(data?.latestCompletedAnimes || data?.mostPopularAnimes || data?.mostFavoriteAnimes) && (
              <div className="w-[380px] flex-shrink-0 hidden lg:block">
                <TopAnimesSidebar
                  latestCompleted={data.latestCompletedAnimes}
                  mostPopular={data.mostPopularAnimes}
                  mostFavorite={data.mostFavoriteAnimes}
                />
              </div>
            )}
          </div>
        </div>

        {/* Top Upcoming with Top 10 Sidebar */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex-1">🗓️ Top Upcoming</h2>
            <div className="w-[380px] flex-shrink-0 hidden lg:flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-2xl font-bold text-white">Top 10 Anime</h2>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              {data?.topUpcomingAnimes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.topUpcomingAnimes.map((anime) => (
                    <AnimeGridCard key={anime.id} anime={anime} />
                  ))}
                </div>
              )}
            </div>

            {data?.top10Animes && (
              <div className="w-[380px] flex-shrink-0 hidden lg:block">
                <Top10Sidebar top10Animes={data.top10Animes} />
              </div>
            )}
          </div>
        </div>

        {/* Genres */}
        {data?.genres && <GenresSection genres={data.genres} />}
      </div>
    </>
  );
}
