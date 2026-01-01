import { useEffect, useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// Anime Card Component (overlay style for trending/scroll sections)
function AnimeCard({ anime, variant = "default" }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {anime.rank && (
          <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700">
            #{anime.rank}
          </Badge>
        )}
        {/* Info inside card */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white truncate text-sm mb-2">{anime.name}</h3>
          <div className="flex items-center gap-2">
            {anime.episodes?.sub && (
              <Badge className="bg-pink-500/90 hover:bg-pink-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
                {anime.episodes.sub}
              </Badge>
            )}
            {anime.type && (
              <span className="text-zinc-400 text-xs">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Anime Card Component (grid style with info below image)
function AnimeGridCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-[260px] object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* Info below image */}
      <div className="mt-2">
        <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">
          {anime.name}
        </h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {anime.episodes?.sub && (
            <Badge className="bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded">
              CC {anime.episodes.sub}
            </Badge>
          )}
          {anime.episodes?.dub && (
            <Badge className="bg-green-600/90 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
              🎙️ {anime.episodes.dub}
            </Badge>
          )}
          {anime.episodes?.dub && (
            <span className="text-zinc-400 text-xs">{anime.episodes.dub}</span>
          )}
          {anime.type && (
            <span className="text-zinc-500 text-xs ml-auto">{anime.type}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Anime Grid Section (displays all content in a responsive grid)
function AnimeGridSection({ title, animes }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.map((anime) => (
          <div key={anime.id} className="w-full">
            <AnimeCard anime={anime} />
          </div>
        ))}
      </div>
    </section>
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
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-purple-500 w-6" : "bg-zinc-600"
                }`}
            />
          ))}
        </div>
      </Link>
    </section>
  );
}

// Horizontal Scroll Section with Navigation Buttons
function AnimeScrollSection({ title, animes, autoSlide = false }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 440; // ~2 cards width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto slide effect
  useEffect(() => {
    if (!autoSlide) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If reached the end, scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoSlide]);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="relative group">
        {/* Left Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-5"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {/* Right Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-5"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div
          ref={scrollRef}
          className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {animes.map((anime) => (
            <div key={anime.id} className="w-[200px] flex-shrink-0">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Top 10 Section with Tabs
function Top10Section({ top10Animes }) {
  const scrollRefs = {
    today: useRef(null),
    week: useRef(null),
    month: useRef(null)
  };

  const scroll = (period, direction) => {
    if (scrollRefs[period].current) {
      const scrollAmount = 440;
      scrollRefs[period].current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
            <div className="relative group">
              {/* Left Button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-5"
                onClick={() => scroll(period, 'left')}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {/* Right Button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-5"
                onClick={() => scroll(period, 'right')}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div
                ref={scrollRefs[period]}
                className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {top10Animes[period]?.map((anime) => (
                  <div key={anime.id + anime.rank} className="w-[200px] flex-shrink-0">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            </div>
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

// Top Animes Sidebar (Latest Completed, Most Popular, Most Favorite)
function TopAnimesSidebar({ latestCompleted, mostPopular, mostFavorite }) {
  const [activeTab, setActiveTab] = useState('popular');

  const tabs = [
    { id: 'completed', label: 'Completed', data: latestCompleted },
    { id: 'popular', label: 'Popular', data: mostPopular },
    { id: 'favorite', label: 'Favorite', data: mostFavorite },
  ];

  const currentData = tabs.find(tab => tab.id === activeTab)?.data || [];

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 h-fit sticky top-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h2 className="text-lg font-bold text-white">Top Trending</h2>
      </div>

      {/* Tab buttons - like Top 10 style */}
      <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-pink-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of animes - Card style with background image */}
      <div className="space-y-2">
        {currentData.slice(0, 10).map((anime, index) => (
          <Link
            key={anime.id}
            to={`/anime/${anime.id}`}
            className="relative flex items-center h-[85px] rounded-lg overflow-hidden group"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={anime.poster}
                alt={anime.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/95 via-zinc-900/70 to-zinc-900/40" />
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-3 p-3 w-full">
              {/* Rank number with decorative lines */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className="w-[2px] h-4 bg-gradient-to-b from-transparent to-teal-500/50" />
                  <div className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-teal-500/50 text-white font-bold text-base">
                    {index + 1}
                  </div>
                  <div className="w-[2px] h-4 bg-gradient-to-t from-transparent to-teal-500/50" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate mb-2 group-hover:text-orange-400 transition-colors">
                  {anime.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {anime.episodes?.sub && (
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                      CC {anime.episodes.sub}
                    </Badge>
                  )}
                  {anime.episodes?.dub && (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      🎙️ {anime.episodes.dub}
                    </Badge>
                  )}
                  {anime.type && (
                    <span className="text-zinc-300 text-[11px] uppercase font-medium">{anime.type}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
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
      <div className="relative -mt-56 z-10 max-w-[1420px] mx-auto px-8 lg:px-12 py-6">
        {/* Trending */}
        {data?.trendingAnimes && (
          <AnimeScrollSection title="Trending Now" animes={data.trendingAnimes} autoSlide />
        )}

        {/* Top Airing */}
        {data?.topAiringAnimes && (
          <AnimeScrollSection
            title="🔥 Top Airing"
            animes={data.topAiringAnimes}
          />
        )}

        {/* Latest Episodes with Sidebar */}
        <div className="mt-8">
          {/* Section Headers - aligned on same line */}
          <div className="flex gap-6 items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex-1">📺 Latest Episodes</h2>
            <div className="w-[320px] flex-shrink-0 hidden lg:block" />
          </div>
          
          <div className="flex gap-6 items-start">
            {/* Latest Episodes - Left side */}
            <div className="flex-1 min-w-0">
              {data?.latestEpisodeAnimes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.latestEpisodeAnimes.map((anime) => (
                    <div key={anime.id}>
                      <AnimeGridCard anime={anime} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Animes Sidebar - Right side */}
            {(data?.latestCompletedAnimes || data?.mostPopularAnimes || data?.mostFavoriteAnimes) && (
              <div className="w-[320px] flex-shrink-0 hidden lg:block">
                <TopAnimesSidebar
                  latestCompleted={data.latestCompletedAnimes}
                  mostPopular={data.mostPopularAnimes}
                  mostFavorite={data.mostFavoriteAnimes}
                />
              </div>
            )}
          </div>
        </div>

        {/* Top 10 */}
        {data?.top10Animes && <Top10Section top10Animes={data.top10Animes} />}

        {/* Top Upcoming */}
        {data?.topUpcomingAnimes && (
          <AnimeScrollSection
            title="🗓️ Top Upcoming"
            animes={data.topUpcomingAnimes}
          />
        )}

        {/* Genres */}
        {data?.genres && <GenresSection genres={data.genres} />}
      </div>
    </>
  );
}
