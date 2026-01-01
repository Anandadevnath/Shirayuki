import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { getHome } from "@/context/api";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Constants
const SPOTLIGHT_INTERVAL = 5000;
const AUTO_SLIDE_INTERVAL = 4000;
const SCROLL_AMOUNT = 440;
const CARD_HEIGHT = 300;
const GRID_CARD_HEIGHT = 280;
const SIDEBAR_CARD_HEIGHT = 100;
const MAX_SIDEBAR_ITEMS = 10;

// Anime Card Component (overlay style for trending/scroll sections)
const AnimeCard = memo(function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={anime.poster}
          alt={anime.name}
          className={`w-full h-[${CARD_HEIGHT}px] object-cover group-hover:scale-105 transition-transform duration-300`}
          loading="lazy"
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
});

// Anime Card Component (grid style with info inside card)
const AnimeGridCard = memo(function AnimeGridCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={anime.poster}
          alt={anime.name}
          className={`w-full h-[${GRID_CARD_HEIGHT}px] object-cover group-hover:scale-105 transition-transform duration-300`}
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {/* Info inside card */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 group-hover:text-orange-400 transition-colors">
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
              <span className="text-zinc-300 text-xs ml-auto">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

// Slider
const SpotlightSection = memo(function SpotlightSection({ spotlightAnimes }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);
  const length = spotlightAnimes.length;

  const goToSlide = useCallback((index) => {
    if (nextIndex !== null || index === currentIndex) return;
    setNextIndex(index);
    // After transition completes, make next the current
    setTimeout(() => {
      setCurrentIndex(index);
      setNextIndex(null);
    }, 700);
  }, [nextIndex, currentIndex]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % length);
  }, [currentIndex, length, goToSlide]);

  const goToPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + length) % length);
  }, [currentIndex, length, goToSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) goToNext();
    }, SPOTLIGHT_INTERVAL);
    return () => clearInterval(interval);
  }, [isDragging, goToNext]);

  // Mouse/Touch drag handlers
  const handleDragStart = useCallback((clientX) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragDelta.current = 0;
  }, []);

  const handleDragMove = useCallback((clientX) => {
    if (!isDragging) return;
    dragDelta.current = clientX - dragStartX.current;
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 80;
    if (dragDelta.current > threshold) {
      goToPrev();
    } else if (dragDelta.current < -threshold) {
      goToNext();
    }
    dragDelta.current = 0;
  }, [isDragging, goToNext, goToPrev]);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const currentAnime = spotlightAnimes[currentIndex];
  const nextAnime = nextIndex !== null ? spotlightAnimes[nextIndex] : null;
  
  const handleDotClick = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    goToSlide(index);
  }, [goToSlide]);

  // Render a slide
  const renderSlide = (anime) => (
    <>
      <img
        src={anime.poster}
        alt={anime.name}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex flex-col justify-center pb-24 max-w-[1480px] mx-auto px-8 lg:px-12 pointer-events-none">
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
        <Link 
          to={`/anime/${anime.id}`}
          className="w-fit px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors pointer-events-auto"
        >
          Learn More
        </Link>
      </div>
    </>
  );

  return (
    <section 
      className="relative w-full h-[730px] -mt-20 overflow-hidden cursor-grab active:cursor-grabbing group select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Slide (stays visible underneath) */}
      <div className="absolute inset-0 z-0">
        {renderSlide(currentAnime)}
      </div>
      
      {/* Next Slide (fades in on top) */}
      {nextAnime && (
        <div 
          className="absolute inset-0 z-10"
          style={{ animation: 'spotlightFadeIn 700ms ease-in-out forwards' }}
        >
          {renderSlide(nextAnime)}
        </div>
      )}
      
      {/* Dots Navigation */}
      <div className="absolute bottom-6 right-8 flex gap-2 z-20">
        {spotlightAnimes.map((_, i) => (
          <button
            key={i}
            onClick={(e) => handleDotClick(e, i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === (nextIndex ?? currentIndex) ? "bg-purple-500 w-6" : "bg-zinc-600 hover:bg-zinc-500"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes spotlightFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
});

// Horizontal Scroll Section with Navigation Buttons
const AnimeScrollSection = memo(function AnimeScrollSection({ title, animes, autoSlide = false }) {
  const scrollRef = useRef(null);

  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollLeft = useCallback(() => scroll('left'), [scroll]);
  const scrollRight = useCallback(() => scroll('right'), [scroll]);

  // Auto slide effect
  useEffect(() => {
    if (!autoSlide) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [autoSlide, scroll]);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="relative group">
        {/* Left Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-5"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {/* Right Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-5"
          onClick={scrollRight}
          aria-label="Scroll right"
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
});

// Reusable Sidebar Item Component
const SidebarAnimeItem = memo(function SidebarAnimeItem({ anime, index, accentColor = "pink" }) {
  const colorClasses = accentColor === "pink" 
    ? "border-pink-500/60 from-pink-500/60 to-pink-500/60"
    : "border-teal-500/60 from-teal-500/60 to-teal-500/60";
  
  return (
    <Link
      to={`/anime/${anime.id}`}
      className={`relative flex items-center h-[${SIDEBAR_CARD_HEIGHT}px] rounded-xl overflow-hidden group`}
    >
      <div className="absolute inset-0">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/95 via-zinc-900/60 to-zinc-900/30" />
      </div>
      <div className="relative flex items-center gap-4 p-4 w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-[2px] h-5 bg-gradient-to-b from-transparent ${colorClasses.split(' ')[1]}`} />
            <div className={`w-11 h-11 flex items-center justify-center rounded-full border-2 ${colorClasses.split(' ')[0]} text-white font-bold text-lg`}>
              {anime.rank || index + 1}
            </div>
            <div className={`w-[2px] h-5 bg-gradient-to-t from-transparent ${colorClasses.split(' ')[2]}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base truncate mb-2 group-hover:text-orange-400 transition-colors">
            {anime.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {anime.episodes?.sub && (
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">
                CC {anime.episodes.sub}
              </Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-green-600 hover:bg-green-600 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-0.5">
                🎙️ {anime.episodes.dub}
              </Badge>
            )}
            {anime.type && (
              <span className="text-zinc-300 text-xs uppercase font-medium">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

// Reusable Tabbed Sidebar Component
const TabbedSidebar = memo(function TabbedSidebar({ tabs, accentColor = "pink" }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  
  const currentData = useMemo(() => 
    tabs.find(tab => tab.id === activeTab)?.data || [],
    [tabs, activeTab]
  );

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 h-fit sticky top-24">
      <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
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
      <div className="space-y-3">
        {currentData.slice(0, MAX_SIDEBAR_ITEMS).map((anime, index) => (
          <SidebarAnimeItem 
            key={anime.id} 
            anime={anime} 
            index={index} 
            accentColor={accentColor} 
          />
        ))}
      </div>
    </div>
  );
});

// Top 10 Sidebar (Today, Week, Month)
const Top10Sidebar = memo(function Top10Sidebar({ top10Animes }) {
  const tabs = useMemo(() => [
    { id: 'today', label: 'Today', data: top10Animes?.today },
    { id: 'week', label: 'Week', data: top10Animes?.week },
    { id: 'month', label: 'Month', data: top10Animes?.month },
  ], [top10Animes]);

  return <TabbedSidebar tabs={tabs} accentColor="pink" />;
});

// Genres Section
const GenresSection = memo(function GenresSection({ genres }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link key={genre} to={`/genre/${genre.toLowerCase()}`}>
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white cursor-pointer transition-colors"
            >
              {genre}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
});

// Top Animes Sidebar (Latest Completed, Most Popular, Most Favorite)
const TopAnimesSidebar = memo(function TopAnimesSidebar({ latestCompleted, mostPopular, mostFavorite }) {
  const tabs = useMemo(() => [
    { id: 'completed', label: 'Completed', data: latestCompleted },
    { id: 'popular', label: 'Popular', data: mostPopular },
    { id: 'favorite', label: 'Favorite', data: mostFavorite },
  ], [latestCompleted, mostPopular, mostFavorite]);

  return <TabbedSidebar tabs={tabs} accentColor="teal" />;
});

// Skeleton
function HomePageSkeleton() {
  return (
    <>
      {/* Spotlight Skeleton - Full Width */}
      <div className="relative w-full h-[730px] -mt-20 overflow-hidden">
        <Skeleton className="w-full h-full bg-zinc-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center pb-24 max-w-[1500px] mx-auto px-8 lg:px-12">
          <Skeleton className="h-12 w-[500px] mb-4 bg-zinc-700" />
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-8 w-20 bg-zinc-700 rounded-full" />
            <Skeleton className="h-8 w-20 bg-zinc-700 rounded-full" />
          </div>
          <Skeleton className="h-4 w-[600px] mb-2 bg-zinc-700" />
          <Skeleton className="h-4 w-[500px] mb-2 bg-zinc-700" />
          <Skeleton className="h-4 w-[400px] mb-6 bg-zinc-700" />
          <Skeleton className="h-12 w-36 bg-zinc-700 rounded-lg" />
        </div>
      </div>

      {/* Rest of content */}
      <div className="relative -mt-56 z-10 max-w-[1500px] mx-auto px-8 lg:px-12 py-6">
        {/* Trending Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-48 mb-4 bg-zinc-800" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[200px] flex-shrink-0">
                <Skeleton className="h-[300px] w-full bg-zinc-800 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Airing Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-40 mb-4 bg-zinc-800" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[200px] flex-shrink-0">
                <Skeleton className="h-[300px] w-full bg-zinc-800 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Episodes + Top Trending Skeleton */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <Skeleton className="h-8 w-48 bg-zinc-800 flex-1 max-w-[200px]" />
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <Skeleton className="h-8 w-40 bg-zinc-800" />
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            {/* Grid Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full bg-zinc-800 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800">
                <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
                  <Skeleton className="flex-1 h-8 bg-zinc-700 rounded-md" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md mx-1" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full bg-zinc-800 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Upcoming + Top 10 Skeleton */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <Skeleton className="h-8 w-48 bg-zinc-800 flex-1 max-w-[200px]" />
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <Skeleton className="h-8 w-40 bg-zinc-800" />
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            {/* Grid Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full bg-zinc-800 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800">
                <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
                  <Skeleton className="flex-1 h-8 bg-zinc-700 rounded-md" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md mx-1" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full bg-zinc-800 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Genres Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-32 mb-4 bg-zinc-800" />
          <div className="flex flex-wrap gap-2">
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 bg-zinc-800 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </>
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
      <div className="relative -mt-56 z-10 max-w-[1480px] mx-auto px-8 lg:px-12 py-6">
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
            <div className="w-[380px] flex-shrink-0 hidden lg:flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-2xl font-bold text-white">Top Trending</h2>
            </div>
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
          {/* Section Headers - aligned on same line */}
          <div className="flex gap-6 items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex-1">🗓️ Top Upcoming</h2>
            <div className="w-[380px] flex-shrink-0 hidden lg:flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-2xl font-bold text-white">Top 10 Anime</h2>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            {/* Top Upcoming - Left side */}
            <div className="flex-1 min-w-0">
              {data?.topUpcomingAnimes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.topUpcomingAnimes.map((anime) => (
                    <div key={anime.id}>
                      <AnimeGridCard anime={anime} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 10 Sidebar - Right side */}
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
