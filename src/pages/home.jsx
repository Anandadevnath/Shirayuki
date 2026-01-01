import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHome } from "@/context/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Anime Card Component
function AnimeCard({ anime, variant = "default" }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl mb-3">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {anime.rank && (
          <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700">
            #{anime.rank}
          </Badge>
        )}
      </div>
      {/* Info below image */}
      <h3 className="font-semibold text-white truncate text-sm mb-2">{anime.name}</h3>
      <div className="flex items-center gap-2">
        {anime.episodes?.sub && (
          <Badge className="bg-pink-500/90 hover:bg-pink-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            {anime.episodes.sub}
          </Badge>
        )}
        {anime.type && (
          <span className="text-zinc-400 text-xs">{anime.type}</span>
        )}
      </div>
    </Link>
  );
}

// Spotlight Carousel Component
function SpotlightSection({ spotlightAnimes }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % spotlightAnimes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [spotlightAnimes.length]);

  const anime = spotlightAnimes[currentIndex];

  return (
    <section className="relative w-full h-[730px] -mt-20 overflow-hidden cursor-pointer group">
      <Link to={`/anime/${anime.id}`} className="block w-full h-full">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center pb-24 max-w-[1420px] mx-auto px-8 lg:px-12">
          <h1 className="text-5xl font-bold text-white mb-4 max-w-2xl">{anime.name}</h1>
          <div className="flex gap-3 mb-4">
            {anime.episodes?.sub && (
              <Badge className="bg-zinc-800/80 text-white border border-zinc-600 px-3 py-1">
                <span className="mr-1">📺</span> {anime.episodes.sub}
              </Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-zinc-800/80 text-white border border-zinc-600 px-3 py-1">
                <span className="mr-1">🎙️</span> {anime.episodes.dub}
              </Badge>
            )}
          </div>
          <p className="text-zinc-300 max-w-2xl line-clamp-4 text-base leading-relaxed mb-6">{anime.description}</p>
          <button className="w-fit px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors">
            Learn More
          </button>
        </div>
        {/* Dots Navigation */}
        <div className="absolute bottom-6 right-8 flex gap-2" onClick={(e) => e.preventDefault()}>
          {spotlightAnimes.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(i);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-purple-500 w-6" : "bg-zinc-600"
              }`}
            />
          ))}
        </div>
      </Link>
    </section>
  );
}

// Horizontal Scroll Section
function AnimeScrollSection({ title, animes }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {animes.map((anime) => (
            <div key={anime.id} className="w-[200px] flex-shrink-0">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

// Top 10 Section with Tabs
function Top10Section({ top10Animes }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Top 10 Anime</h2>
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        {["today", "week", "month"].map((period) => (
          <TabsContent key={period} value={period}>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {top10Animes[period]?.map((anime) => (
                  <div key={anime.id + anime.rank} className="w-[200px] flex-shrink-0">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

// Genres Section
function GenresSection({ genres }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Badge
            key={genre}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white cursor-pointer transition-colors"
          >
            {genre}
          </Badge>
        ))}
      </div>
    </section>
  );
}

// Loading Skeleton
function HomePageSkeleton() {
  return (
    <div className="max-w-[1420px] mx-auto px-8 lg:px-12 py-6">
      <Skeleton className="h-[500px] w-full rounded-xl bg-zinc-800" />
      <div className="mt-8">
        <Skeleton className="h-8 w-48 mb-4 bg-zinc-800" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[200px] flex-shrink-0">
              <Skeleton className="h-[280px] w-full bg-zinc-800 rounded-lg" />
              <Skeleton className="h-4 w-full mt-2 bg-zinc-800" />
              <Skeleton className="h-3 w-3/4 mt-1 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Home Component
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
      {/* Spotlight - Full Width */}
      {data?.spotlightAnimes && (
        <SpotlightSection spotlightAnimes={data.spotlightAnimes} />
      )}

      {/* Rest of content in container - overlapping slider */}
      <div className="relative -mt-42 z-10 max-w-[1420px] mx-auto px-8 lg:px-12 py-6">
        {/* Trending */}
        {data?.trendingAnimes && (
          <AnimeScrollSection title="🔥 Trending Now" animes={data.trendingAnimes} />
        )}

      {/* Latest Episodes */}
      {data?.latestEpisodeAnimes && (
        <AnimeScrollSection
          title="📺 Latest Episodes"
          animes={data.latestEpisodeAnimes}
        />
      )}

      {/* Top 10 */}
      {data?.top10Animes && <Top10Section top10Animes={data.top10Animes} />}

      {/* Top Upcoming */}
      {data?.topUpcomingAnimes && (
        <AnimeScrollSection
          title="🗓️ Top Upcoming"
          animes={data.topUpcomingAnimes}
        />
      )}

      {/* Top Airing */}
      {data?.topAiringAnimes && (
        <AnimeScrollSection title="📡 Top Airing" animes={data.topAiringAnimes} />
      )}

      {/* Most Popular */}
      {data?.mostPopularAnimes && (
        <AnimeScrollSection
          title="⭐ Most Popular"
          animes={data.mostPopularAnimes}
        />
      )}

      {/* Most Favorite */}
      {data?.mostFavoriteAnimes && (
        <AnimeScrollSection
          title="❤️ Most Favorite"
          animes={data.mostFavoriteAnimes}
        />
      )}

      {/* Latest Completed */}
      {data?.latestCompletedAnimes && (
        <AnimeScrollSection
          title="✅ Recently Completed"
          animes={data.latestCompletedAnimes}
        />
      )}

      {/* Genres */}
      {data?.genres && <GenresSection genres={data.genres} />}
      </div>
    </>
  );
}
