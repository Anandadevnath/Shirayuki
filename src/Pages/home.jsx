import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import apiService from '../context/apiService';
import SliderHero from '../components/SliderHero.jsx';
import TrendingSection from '../components/TrendingSection.jsx';
import AnimeStatsSection from '../components/AnimeStatsSection.jsx';
import LatestAndLeaderboardSection from '../components/LatestAndLeaderboardSection.jsx';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import {
  ErrorMessage,
  SliderHeroSkeleton,
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

function getAnimeId(a) {
  if (!a) return null;
  if (typeof a === 'string') return a;

  return (
    a.japanese ||
    a.title ||
    a.id ||
    a.slug ||
    a.animeId ||
    a._id ||
    null
  );
}

function normalizeAnimeItem(raw = {}) {
  const item = { ...raw };

  // Normalize episodes container
  item.episodes = typeof item.episodes === 'object' ? { ...item.episodes } : {};

  const sub = item.sub ?? item.Sub ?? item.episodes.sub ?? item.episodes.Sub;
  const dub = item.dub ?? item.Dub ?? item.episodes.dub ?? item.episodes.Dub;

  if (sub !== undefined) item.episodes.sub = item.sub = sub;
  if (dub !== undefined) item.episodes.dub = item.dub = dub;

  item.poster = item.poster || item.image;
  item.image = item.image || item.poster;

  item.title = item.title || item.name;
  item.name = item.name || item.title;

  return item;
}

/* -------------------------------------
   Component
-------------------------------------- */
function Home() {
  const navigate = useNavigate();
  const {
    getHomepage,
    getRecentUpdates,
    getRecentUpdatesDub,
    getTrending,
    loading,
    error,
    clearError
  } = useShirayukiAPI();

  /* ------------------------------
      State
  ------------------------------- */
  const [homeData, setHomeData] = useState(null);
  const [recentSub, setRecentSub] = useState([]);
  const [recentDub, setRecentDub] = useState([]);
  const [trendingData, setTrendingData] = useState([]);
  const [statsData, setStatsData] = useState({
    mostPopular: [],
    topAiring: [],
    mostFavorite: []
  });

  // UI + interactions
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);

  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);
  const [trendingPaused, setTrendingPaused] = useState(false);

  const [trendingLoading, setTrendingLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);

  /* refs */
  const trendingIntervalRef = useRef(null);
  const isInitialized = useRef(false);
  const isFetching = useRef({
    trending: false, stats: false, recent: false, home: false
  });

  /* Derived */
  const sliderData = useMemo(() => filterSection(homeData, 'slider'), [homeData]);

  /* -------------------------------------
      Fetch: Home data
  -------------------------------------- */
  const fetchHomeData = useCallback(async () => {
    if (isFetching.current.home) return;
    isFetching.current.home = true;

    try {
      clearError();
      const data = await getHomepage();
      const raw = data?.data || [];
      setHomeData(Array.isArray(raw) ? raw.map(normalizeAnimeItem) : raw);
    } catch {
      setHomeData([]);
    } finally {
      isFetching.current.home = false;
    }
  }, [getHomepage, clearError]);

  /* -------------------------------------
      Fetch: Recent Sub/Dub
  -------------------------------------- */
  const fetchRecentUpdates = useCallback(async () => {
    if (isFetching.current.recent) return;
    isFetching.current.recent = true;
    setRecentLoading(true);

    try {
      const [subRes, dubRes] = await Promise.all([
        getRecentUpdates(),
        getRecentUpdatesDub()
      ]);

      setRecentSub((subRes?.data || []).map(normalizeAnimeItem));
      setRecentDub((dubRes?.data || []).map(normalizeAnimeItem));

    } catch {
      setRecentSub([]);
      setRecentDub([]);
    } finally {
      setRecentLoading(false);
      isFetching.current.recent = false;
    }
  }, [getRecentUpdates, getRecentUpdatesDub]);

  /* -------------------------------------
      Fetch: Trending
  -------------------------------------- */
  const fetchTrendingData = useCallback(async () => {
    if (isFetching.current.trending) return;
    isFetching.current.trending = true;

    setTrendingLoading(true);
    try {
      const res = await getTrending();
      const raw = res?.data || [];
      setTrendingData(raw.map(normalizeAnimeItem));
    } catch {
      setTrendingData([]);
    } finally {
      setTrendingLoading(false);
      isFetching.current.trending = false;
    }
  }, [getTrending]);

  /* -------------------------------------
      Fetch: Stats
  -------------------------------------- */
  const fetchStats = useCallback(async () => {
    if (isFetching.current.stats) return;
    isFetching.current.stats = true;

    setStatsLoading(true);
    try {
      const [popularRes, airingRes, favoriteRes] = await Promise.all([
        apiService.getMostPopular(),
        apiService.getTopAiring(),
        apiService.getMostFavorite()
      ]);

      setStatsData({
        mostPopular: popularRes.data || [],
        topAiring: airingRes.data || [],
        mostFavorite: favoriteRes.data || []
      });

    } catch {
      setStatsData({ mostPopular: [], topAiring: [], mostFavorite: [] });
    } finally {
      setStatsLoading(false);
      isFetching.current.stats = false;
    }
  }, []);

  /* -------------------------------------
      Init Fetch
  -------------------------------------- */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    fetchHomeData();
    fetchRecentUpdates();
    fetchTrendingData();
    fetchStats();
  }, []);

  /* -------------------------------------
      Slider autoplay
  -------------------------------------- */
  useEffect(() => {
    if (sliderData.length <= 1) return;

    const interval = setInterval(() => {
      setSlideAnimClass('slide-in-right');
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderData.length]);

  /* -------------------------------------
      Trending autoplay
  -------------------------------------- */
  useEffect(() => {
    if (trendingData.length <= 1 || trendingPaused) return;

    trendingIntervalRef.current = setInterval(() => {
      setTrendingSlideIndex((p) => (p + 1) % trendingData.length);
    }, 2000);

    return () => clearInterval(trendingIntervalRef.current);
  }, [trendingData.length, trendingPaused]);

  /* -------------------------------------
      Drag Slider
  -------------------------------------- */
  const handleDragStart = useCallback((e) => {
    setDragging(true);
    setDragStartX(e.touches?.[0]?.clientX ?? e.clientX);
  }, []);

  const handleDragMove = useCallback(
    (e) => {
      if (!dragging || dragStartX === null) return;

      const x = e.touches?.[0]?.clientX ?? e.clientX;
      const diff = x - dragStartX;

      if (Math.abs(diff) > 50) {
        handleSlideChange(diff > 0 ? 'prev' : 'next');
        setDragging(false);
        setDragStartX(null);
      }
    },
    [dragging, dragStartX]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setDragStartX(null);
  }, []);

  /* -------------------------------------
      Manual slide change
  -------------------------------------- */
  const handleSlideChange = useCallback(
    (dir) => {
      if (!sliderData.length) return;
      const max = sliderData.length;
      const next = dir === 'next'
        ? (currentSlide + 1) % max
        : (currentSlide - 1 + max) % max;

      setSlideAnimClass(dir === 'next' ? 'slide-in-right' : 'slide-in-left');
      setCurrentSlide(next);
    },
    [sliderData.length, currentSlide]
  );

  /* -------------------------------------
      Trending nav
  -------------------------------------- */
  const handleTrendingPrev = useCallback(() => {
    setTrendingPaused(true);
    clearInterval(trendingIntervalRef.current);
    setTrendingSlideIndex((p) => (p - 1 + trendingData.length) % trendingData.length);
  }, [trendingData.length]);

  const handleTrendingNext = useCallback(() => {
    setTrendingPaused(true);
    clearInterval(trendingIntervalRef.current);
    setTrendingSlideIndex((p) => (p + 1) % trendingData.length);
  }, [trendingData.length]);

  /* -------------------------------------
      Spotlight helper
  -------------------------------------- */
  const getCurrentSpotlight = useCallback(
    () => sliderData[currentSlide] ?? null,
    [sliderData, currentSlide]
  );

  /* -------------------------------------
      Anime click
  -------------------------------------- */
  const handleAnimeClick = useCallback(
    (anime) => {
      const id = getAnimeId(anime);
      if (!id) return;

      const state = {};

      if (typeof anime === 'object') {
        if (anime.sub) state.trendingSub = anime.sub;
        if (anime.dub) state.trendingDub = anime.dub;
        if (anime.section === 'trending') state.fromTrending = true;
      }

      navigate(`/anime/${encodeURIComponent(id)}`, {
        state: Object.keys(state).length ? state : undefined
      });
    },
    [navigate]
  );

  /* -------------------------------------
      Clear animation class
  -------------------------------------- */
  useEffect(() => {
    if (!slideAnimClass) return;

    const to = setTimeout(() => setSlideAnimClass(''), 600);
    return () => clearTimeout(to);
  }, [slideAnimClass]);

  /* -------------------------------------
      Loading & Error UI
  -------------------------------------- */
  if (loading && !homeData) {
    return (
      <div className="home-full-bg relative overflow-x-hidden" style={{ minHeight: '100vh', width: '100vw' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url('/sword.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.45)'
        }} />
        <div className="absolute inset-0 bg-black/40" />

        <SliderHeroSkeleton />

        <div className="relative z-10" style={{ marginTop: '-20vh' }}>
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
              style={{
                background: `linear-gradient(180deg,
                  transparent 0%, rgba(0,0,0,0.1) 10%, 
                  rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.6) 60%, 
                  rgba(0,0,0,1) 100%)`
              }}
            />

            <div className="relative z-10 w-full pt-38 px-22">
              <TrendingSectionSkeleton />
            </div>

            <div className="w-full mx-auto px-22 py-0 relative z-10">
              <AnimeStatsSectionSkeleton />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <LatestSectionSkeleton />
                  <LatestSectionSkeleton />
                </div>
                <div className="lg:col-span-1">
                  <LeaderboardSkeleton />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (error && !homeData) {
    return (
      <Backdrop image="/tanjiro.png" blurPx={6}>
        <div className="p-4 w-full max-w-md">
          <ErrorMessage message={error} onRetry={fetchHomeData} />
        </div>
      </Backdrop>
    );
  }

  /* -------------------------------------
      MAIN RENDER
  -------------------------------------- */
  return (
    <div className="home-full-bg relative overflow-x-hidden" style={{ minHeight: '100vh', width: '100vw' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `url('/sword.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(10px) brightness(0.45)'
      }} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Slider Hero */}
      {!homeData || sliderData.length === 0 ? (
        <SliderHeroSkeleton />
      ) : (
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
      )}

      <div className="relative z-10" style={{ marginTop: '-20vh' }}>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: `linear-gradient(180deg,
                transparent 0%, rgba(0,0,0,0.1) 10%, 
                rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.6) 60%, 
                rgba(0,0,0,1) 100%)`
            }}
          />

          {/* Trending */}
          <div className="relative z-10 w-full pt-38 px-22">
            {trendingLoading ? (
              <TrendingSectionSkeleton />
            ) : trendingData.length > 0 ? (
              <TrendingSection
                trendingData={trendingData}
                trendingSlideIndex={trendingSlideIndex}
                handleTrendingPrev={handleTrendingPrev}
                handleTrendingNext={handleTrendingNext}
                handleAnimeClick={handleAnimeClick}
              />
            ) : null}
          </div>

          {/* Stats + Latest + Leaderboard */}
          <div className="w-full mx-auto px-22 py-0 relative z-10">
            {statsLoading ? (
              <AnimeStatsSectionSkeleton />
            ) : (
              <AnimeStatsSection {...statsData} />
            )}

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
