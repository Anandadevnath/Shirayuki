import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import apiService from '../context/apiService';
import SliderHero from '../components/SliderHero.jsx';
import TrendingSection from '../components/TrendingSection.jsx';
import AnimeStatsSection from '../components/AnimeStatsSection.jsx';
import LatestAndLeaderboardSection from '../components/LatestAndLeaderboardSection.jsx';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  TrendingSectionSkeleton,
  AnimeStatsSectionSkeleton,
  LatestSectionSkeleton,
  LeaderboardSkeleton
} from '../components/LoadingStates';
import Backdrop from '../components/Backdrop';
import { useNavigate } from 'react-router-dom';


function filterSection(data, section) {
  return Array.isArray(data) ? data.filter((a) => a.section === section) : [];
}

function getAnimeId(animeOrId) {
  if (!animeOrId) return null;
  if (typeof animeOrId === 'string') return animeOrId;
  if (typeof animeOrId === 'object') {
    return (
      animeOrId.japanese ||
      animeOrId.title ||
      animeOrId.id ||
      animeOrId.slug ||
      animeOrId.animeId ||
      animeOrId._id
    );
  }
  return null;
}

function Home() {
  const [mostPopular, setMostPopular] = useState([]);
  const [topAiring, setTopAiring] = useState([]);
  const [mostFavorite, setMostFavorite] = useState([]);
  const fetchStats = async () => {
    if (isFetching.current.stats) return;
    isFetching.current.stats = true;
    
    setStatsLoading(true);
    try {
      const [popularRes, airingRes, favoriteRes] = await Promise.all([
        apiService.getMostPopular(),
        apiService.getTopAiring(), 
        apiService.getMostFavorite()
      ]);
      setMostPopular(popularRes.data || []);
      setTopAiring(airingRes.data || []);
      setMostFavorite(favoriteRes.data || []);
    } catch (error) {
      setMostPopular([]);
      setTopAiring([]);
      setMostFavorite([]);
    } finally {
      setStatsLoading(false);
      isFetching.current.stats = false;
    }
  };
  const { getHomepage, getRecentUpdates, getRecentUpdatesDub, getTrending, loading, error, clearError } = useShirayukiAPI();
  const [homeData, setHomeData] = useState(null);
  const [recentSub, setRecentSub] = useState([]);
  const [recentDub, setRecentDub] = useState([]);
  const [trendingData, setTrendingData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);
  const [trendingPaused, setTrendingPaused] = useState(false);
  
  // Loading states for different sections
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  
  // Refs to track loading state and prevent multiple calls
  const trendingIntervalRef = useRef(null);
  const isInitialized = useRef(false);
  const isFetching = useRef({
    trending: false,
    stats: false,
    recent: false,
    home: false
  });
  const navigate = useNavigate();

  const sliderData = useMemo(() => filterSection(homeData, 'slider'), [homeData]);

  const normalizeAnimeItem = (raw = {}) => {
    const item = { ...raw };

    if (typeof item.Sub !== 'undefined' && typeof item.sub === 'undefined') item.sub = item.Sub;
    if (typeof item.Dub !== 'undefined' && typeof item.dub === 'undefined') item.dub = item.Dub;

    item.episodes = item.episodes && typeof item.episodes === 'object' ? { ...item.episodes } : {};

    const nestedSub = item.episodes.sub ?? item.episodes.Sub;
    const nestedDub = item.episodes.dub ?? item.episodes.Dub;
    if (typeof item.Sub !== 'undefined') item.sub = item.Sub;
    if (typeof item.Dub !== 'undefined') item.dub = item.Dub;
    if (typeof nestedSub !== 'undefined' && typeof item.sub === 'undefined') item.sub = nestedSub;
    if (typeof nestedDub !== 'undefined' && typeof item.dub === 'undefined') item.dub = nestedDub;

    if (typeof item.sub !== 'undefined') item.episodes.sub = item.sub;
    if (typeof item.dub !== 'undefined') item.episodes.dub = item.dub;

    if (!item.poster && item.image) item.poster = item.image;
    if (!item.image && item.poster) item.image = item.poster;

    if (!item.title && item.name) item.title = item.name;
    if (!item.name && item.title) item.name = item.title;

    return item;
  };

  const handleTrendingPrev = useCallback(() => {
    setTrendingPaused(true);
    if (trendingIntervalRef.current) {
      clearInterval(trendingIntervalRef.current);
      trendingIntervalRef.current = null;
    }
    setTrendingSlideIndex((prev) => (prev - 1 + trendingData.length) % Math.max(1, trendingData.length));
  }, [trendingData.length]);

  const handleTrendingNext = useCallback(() => {
    setTrendingPaused(true);
    if (trendingIntervalRef.current) {
      clearInterval(trendingIntervalRef.current);
      trendingIntervalRef.current = null;
    }
    setTrendingSlideIndex((prev) => (prev + 1) % Math.max(1, trendingData.length));
  }, [trendingData.length]);


  const handleDragStart = useCallback((e) => {
    setDragging(true);
    setDragStartX(e.type === 'touchstart' ? e.touches[0].clientX : e.clientX);
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!dragging || dragStartX === null) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    if (Math.abs(diff) > 50) {
      handleSlideChange(diff > 0 ? 'prev' : 'next');
      setDragging(false);
      setDragStartX(null);
    }
  }, [dragging, dragStartX]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setDragStartX(null);
  }, []);


  useEffect(() => {
    const slideCount = sliderData.length;
    if (slideCount <= 1) return;
    const interval = setInterval(() => {
      setSlideAnimClass('slide-in-right');
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  useEffect(() => {
    if (trendingData.length <= 1) return;
    if (trendingPaused) return undefined;
    trendingIntervalRef.current = setInterval(() => {
      setTrendingSlideIndex((prev) => (prev + 1) % Math.max(1, trendingData.length));
    }, 2000);
    return () => {
      if (trendingIntervalRef.current) {
        clearInterval(trendingIntervalRef.current);
        trendingIntervalRef.current = null;
      }
    };
  }, [trendingData.length, trendingPaused]);


  // Initialize data only once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    fetchHomeData();
    fetchRecentUpdates();
    fetchTrendingData();
    fetchStats();
  }, []);

  // Fetch trending data
  const fetchTrendingData = async () => {
    if (isFetching.current.trending) return;
    isFetching.current.trending = true;
    
    setTrendingLoading(true);
    try {
      const data = await getTrending();
      const raw = data?.data || [];
      const normalized = Array.isArray(raw) ? raw.map(normalizeAnimeItem) : [];
      setTrendingData(normalized);
    } catch (err) {
      console.error('Failed to fetch trending data:', err);
      setTrendingData([]);
    } finally {
      setTrendingLoading(false);
      isFetching.current.trending = false;
    }
  };


  // Data fetching handlers
  const fetchHomeData = async () => {
    if (isFetching.current.home) return;
    isFetching.current.home = true;
    
    try {
      clearError();
      const data = await getHomepage();
      const raw = data?.data || [];
      const normalized = Array.isArray(raw) ? raw.map(normalizeAnimeItem) : raw;
      setHomeData(normalized);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      isFetching.current.home = false;
    }
  };

  const fetchRecentUpdates = async () => {
    if (isFetching.current.recent) return;
    isFetching.current.recent = true;
    
    setRecentLoading(true);
    try {
      const [subRes, dubRes] = await Promise.all([
        getRecentUpdates(),
        getRecentUpdatesDub()
      ]);
      
      const rawSub = subRes?.data || [];
      const normalizedSub = Array.isArray(rawSub) ? rawSub.map(normalizeAnimeItem) : rawSub;
      setRecentSub(normalizedSub);

      const rawDub = dubRes?.data || [];
      const normalizedDub = Array.isArray(rawDub) ? rawDub.map(normalizeAnimeItem) : rawDub;
      setRecentDub(normalizedDub);
    } catch (err) {
      setRecentSub([]);
      setRecentDub([]);
    } finally {
      setRecentLoading(false);
      isFetching.current.recent = false;
    }
  };


  // Slide change handler
  const handleSlideChange = useCallback((direction) => {
    if (!sliderData || sliderData.length === 0) return;
    const maxSlides = sliderData.length;
    let newSlide;
    if (direction === 'next') {
      newSlide = (currentSlide + 1) % maxSlides;
    } else {
      newSlide = (currentSlide - 1 + maxSlides) % maxSlides;
    }
    setSlideAnimClass(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    setCurrentSlide(newSlide);
  }, [sliderData, currentSlide]);


  // Memoized current spotlight
  const getCurrentSpotlight = useCallback(() => {
    return sliderData && sliderData.length > 0 ? sliderData[currentSlide] : null;
  }, [sliderData, currentSlide]);


  // Anime click handler (reusable)
  const handleAnimeClick = useCallback((animeOrId) => {
    const resolvedId = getAnimeId(animeOrId);
    if (!resolvedId) return;
    
    // Pass trending data if available (contains accurate sub/dub counts)
    const navigationState = {};
    if (animeOrId && typeof animeOrId === 'object') {
      if (animeOrId.sub !== undefined) navigationState.trendingSub = animeOrId.sub;
      if (animeOrId.dub !== undefined) navigationState.trendingDub = animeOrId.dub;
      if (animeOrId.section === 'trending') navigationState.fromTrending = true;
    }
    
    navigate(`/anime/${encodeURIComponent(resolvedId)}`, { 
      state: Object.keys(navigationState).length > 0 ? navigationState : undefined 
    });
  }, [navigate]);


  // Reset animation class after animation
  useEffect(() => {
    if (!slideAnimClass) return;
    const timeout = setTimeout(() => setSlideAnimClass(''), 600);
    return () => clearTimeout(timeout);
  }, [slideAnimClass, currentSlide]);


  // Loading and error states
  if (loading && !homeData) {
    return (
      <Backdrop image={'/tanjiro.png'} blurPx={6} scale={1}>
        <LoadingSpinner size="large" />
      </Backdrop>
    );
  }

  if (error && !homeData) {
    return (
      <Backdrop image={'/tanjiro.png'} blurPx={6} scale={1}>
        <div className="p-4 w-full max-w-md">
          <ErrorMessage message={error} onRetry={fetchHomeData} />
        </div>
      </Backdrop>
    );
  }

  return (
    <div className="home-full-bg relative overflow-x-hidden" style={{ minHeight: '100vh', width: '100vw', position: 'relative', zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/sword.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(10px) brightness(0.45) saturate(0.9)',
          transform: 'scale(1)'
        }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />

      {/* --- Slider Hero --- */}
      <SliderHero
        sliderData={sliderData}
        currentSlide={currentSlide}
        slideAnimClass={slideAnimClass}
        dragging={dragging}
        handleDragStart={handleDragStart}
        handleDragMove={handleDragMove}
        handleDragEnd={handleDragEnd}
        getCurrentSpotlight={getCurrentSpotlight}
        handleAnimeClick={handleAnimeClick}
      />

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10" style={{ marginTop: '-20vh' }}>
        <div className="relative">
          <div
            className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: `linear-gradient(180deg,
                rgba(0,0,0,0) 0%, 
                rgba(0,0,0,0.1) 10%, 
                rgba(0,0,0,0.3) 30%, 
                rgba(0,0,0,0.6) 60%, 
                rgba(0,0,0,0.9) 90%, 
                rgba(0,0,0,1) 100%)`,
            }}
          ></div>

          <div className="max-w-[92vw] mx-auto px-6 py-12 pt-32 relative z-10">
            {/* --- TRENDING SECTION --- */}
            {trendingLoading ? (
              <TrendingSectionSkeleton />
            ) : (
              <TrendingSection
                trendingData={trendingData}
                trendingSlideIndex={trendingSlideIndex}
                handleTrendingPrev={handleTrendingPrev}
                handleTrendingNext={handleTrendingNext}
                handleAnimeClick={handleAnimeClick}
              />
            )}

            {/* --- STATS SECTION --- */}
            {statsLoading ? (
              <AnimeStatsSectionSkeleton />
            ) : (
              <AnimeStatsSection
                mostPopular={mostPopular}
                topAiring={topAiring}
                mostFavorite={mostFavorite}
              />
            )}

            {/* --- LATEST + LEADERBOARD --- */}
            {recentLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <LatestSectionSkeleton />
                  <LatestSectionSkeleton />
                </div>
                <div className="lg:col-span-1">
                  <LeaderboardSkeleton />
                </div>
              </div>
            ) : (
              <LatestAndLeaderboardSection
                recentSub={recentSub}
                recentDub={recentDub}
                handleAnimeClick={handleAnimeClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;