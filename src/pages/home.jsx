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
    <Link to={`/anime/${anime.id}`}>
      <Card className="group overflow-hidden bg-zinc-900 border-zinc-800 hover:border-purple-500 transition-all duration-300 cursor-pointer">
        <div className="relative overflow-hidden">
          <img
            src={anime.poster}
            alt={anime.name}
            className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {anime.rank && (
            <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700">
              #{anime.rank}
            </Badge>
          )}
          {anime.episodes && (
            <div className="absolute bottom-2 left-2 flex gap-2">
              {anime.episodes.sub && (
                <Badge variant="secondary" className="bg-yellow-600/90 text-white">
                  SUB: {anime.episodes.sub}
                </Badge>
              )}
              {anime.episodes.dub && (
                <Badge variant="secondary" className="bg-blue-600/90 text-white">
                  DUB: {anime.episodes.dub}
                </Badge>
              )}
            </div>
          )}
          {anime.type && (
            <Badge className="absolute top-2 right-2 bg-zinc-800/90">
              {anime.type}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-white truncate">{anime.name}</h3>
          <p className="text-sm text-zinc-400 truncate">{anime.jname}</p>
        </CardContent>
      </Card>
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
    <Link to={`/anime/${anime.id}`}>
      <section className="relative h-[500px] overflow-hidden rounded-xl cursor-pointer group">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <Badge className="w-fit mb-3 bg-purple-600">#{anime.rank} Spotlight</Badge>
          <h1 className="text-4xl font-bold text-white mb-2">{anime.name}</h1>
          <p className="text-zinc-300 mb-2">{anime.jname}</p>
          <div className="flex gap-2 mb-4">
            {anime.otherInfo?.map((info, i) => (
              <Badge key={i} variant="outline" className="border-zinc-600 text-zinc-300">
                {info}
              </Badge>
            ))}
          </div>
          <p className="text-zinc-400 max-w-2xl line-clamp-3">{anime.description}</p>
          <div className="flex gap-2 mt-4">
            {anime.episodes?.sub && (
              <Badge className="bg-yellow-600">SUB: {anime.episodes.sub}</Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-blue-600">DUB: {anime.episodes.dub}</Badge>
            )}
          </div>
        </div>
        {/* Dots Navigation */}
        <div className="absolute bottom-4 right-8 flex gap-2" onClick={(e) => e.preventDefault()}>
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
      </section>
    </Link>
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
    <div className="container mx-auto px-4 py-6">
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
    <div className="container mx-auto px-4 py-6">
      {/* Spotlight */}
      {data?.spotlightAnimes && (
        <SpotlightSection spotlightAnimes={data.spotlightAnimes} />
      )}

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
  );
}
