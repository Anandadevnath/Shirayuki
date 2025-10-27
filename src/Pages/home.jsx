import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';
import ScheduleSection from '../components/ScheduleSection.jsx';
import LatestAnimeCard from '../components/LatestAnimeCard.jsx';
import { FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineHd } from 'react-icons/md';
import { BsFillVolumeUpFill, BsFillChatLeftTextFill } from 'react-icons/bs';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import Backdrop from '../components/Backdrop';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AnimeSections from '../components/AnimeSections';


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
  const { getHomepage, getRecentUpdates, getRecentUpdatesDub, loading, error, clearError } = useShirayukiAPI();
  const [homeData, setHomeData] = useState(null);
  const [recentSub, setRecentSub] = useState([]);
  const [recentDub, setRecentDub] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);
  const [trendingPaused, setTrendingPaused] = useState(false);
  const trendingIntervalRef = useRef(null);
  const navigate = useNavigate();


  // Memoized filtered data for efficiency
  const sliderData = useMemo(() => filterSection(homeData, 'slider'), [homeData]);
  const trendingData = useMemo(() => filterSection(homeData, 'trending'), [homeData]);

  // Normalize API items to a consistent shape used by components
  const normalizeAnimeItem = (raw = {}) => {
    // Clone to avoid mutating original
    const item = { ...raw };

    // Normalize Sub/Dub (API sometimes returns capitalized keys)
    if (typeof item.Sub !== 'undefined' && typeof item.sub === 'undefined') item.sub = item.Sub;
    if (typeof item.Dub !== 'undefined' && typeof item.dub === 'undefined') item.dub = item.Dub;

    // Some payloads use nested episodes object
    // Some payloads use nested episodes object. Normalize into both top-level and episodes object
    item.episodes = item.episodes && typeof item.episodes === 'object' ? { ...item.episodes } : {};
    // prefer explicit keys, but fall back to nested ones
    const nestedSub = item.episodes.sub ?? item.episodes.Sub;
    const nestedDub = item.episodes.dub ?? item.episodes.Dub;
    if (typeof item.Sub !== 'undefined') item.sub = item.Sub;
    if (typeof item.Dub !== 'undefined') item.dub = item.Dub;
    if (typeof nestedSub !== 'undefined' && typeof item.sub === 'undefined') item.sub = nestedSub;
    if (typeof nestedDub !== 'undefined' && typeof item.dub === 'undefined') item.dub = nestedDub;

    // Mirror top-level into episodes for components that read anime.episodes.sub / dub
    if (typeof item.sub !== 'undefined') item.episodes.sub = item.sub;
    if (typeof item.dub !== 'undefined') item.episodes.dub = item.dub;

    // Ensure poster/image keys exist for components
    if (!item.poster && item.image) item.poster = item.image;
    if (!item.image && item.poster) item.image = item.poster;

    // Make sure title/name fields are accessible
    if (!item.title && item.name) item.title = item.name;
    if (!item.name && item.title) item.name = item.title;

    return item;
  };

  // Trending carousel navigation handlers
  const handleTrendingPrev = useCallback(() => {
    setTrendingPaused(true);
    if (trendingIntervalRef.current) {
      clearInterval(trendingIntervalRef.current);
      trendingIntervalRef.current = null;
    }
    setTrendingSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleTrendingNext = useCallback(() => {
    setTrendingPaused(true);
    if (trendingIntervalRef.current) {
      clearInterval(trendingIntervalRef.current);
      trendingIntervalRef.current = null;
    }
    const CARD_WIDTH = 220 + 12;
    const CONTAINER_WIDTH = window.innerWidth * 0.9;
    const visibleCards = Math.floor(CONTAINER_WIDTH / CARD_WIDTH);
    const maxIndex = Math.max(0, trendingData.length - visibleCards);
    setTrendingSlideIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [trendingData.length]);


  // Slider drag handlers
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


  // Auto-advance slider
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
    const CARD_WIDTH = 220 + 12;
    const CONTAINER_WIDTH = window.innerWidth * 0.9;
    const visibleCards = Math.floor(CONTAINER_WIDTH / CARD_WIDTH);
    const maxIndex = Math.max(0, trendingData.length - visibleCards);
    if (trendingPaused) return undefined;
    trendingIntervalRef.current = setInterval(() => {
      setTrendingSlideIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex > maxIndex) {
          return 0;
        }
        return nextIndex;
      });
    }, 2000);
    return () => {
      if (trendingIntervalRef.current) {
        clearInterval(trendingIntervalRef.current);
        trendingIntervalRef.current = null;
      }
    };
  }, [trendingData.length, trendingPaused]);


  useEffect(() => {
    fetchHomeData();
    fetchRecentUpdates();
  }, []);


  // Data fetching handlers
  const fetchHomeData = useCallback(async () => {
    try {
      clearError();
      const data = await getHomepage();
      const raw = data?.data || [];
      // Normalize each item so components can rely on lowercase keys like `sub` and `dub`
      const normalized = Array.isArray(raw) ? raw.map(normalizeAnimeItem) : raw;
      setHomeData(normalized);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    }
  }, [getHomepage, clearError]);

  const fetchRecentUpdates = useCallback(async () => {
    try {
      const subRes = await getRecentUpdates();
      const rawSub = subRes?.data || [];
      const normalizedSub = Array.isArray(rawSub) ? rawSub.map(normalizeAnimeItem) : rawSub;
      setRecentSub(normalizedSub);

      const dubRes = await getRecentUpdatesDub();
      const rawDub = dubRes?.data || [];
      const normalizedDub = Array.isArray(rawDub) ? rawDub.map(normalizeAnimeItem) : rawDub;
      setRecentDub(normalizedDub);
    } catch (err) {}
  }, [getRecentUpdates, getRecentUpdatesDub]);


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
    navigate(`/anime/${encodeURIComponent(resolvedId)}`);
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
      {sliderData.length > 0 && (
        <section
          className="slider-hero-container"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{ userSelect: dragging ? 'none' : undefined }}
        >
          <div className={`slider-hero-anim-wrapper`} style={{ height: '100%' }}>
            {sliderData.map((s, idx) => (
              <img
                key={`bg-${idx}`}
                className={`slider-hero-bg-layer ${idx === currentSlide ? 'active' : ''}`}
                src={s.image || '/placeholder-hero.jpg'}
                alt={s.title || `slide-${idx}`}
              />
            ))}
            <div className="slider-hero-overlay" />
            <div
              className={`slider-hero-content ${slideAnimClass} ${slideAnimClass ? 'animate' : ''}`}
              style={{ marginLeft: 'calc(4rem + 1.5rem)' }}
            >
              <div className="slider-hero-badge">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="12" fill="#fff2" />
                  <path
                    d="M7 10v4a2 2 0 002 2h6"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 14V8a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h6z"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>#{currentSlide + 1} Spotlight</span>
              </div>

              <div className="slider-hero-title">
                {getCurrentSpotlight()?.title || 'Anime Title'}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {getCurrentSpotlight()?.sub && (
                  <span className="slider-hero-badge">
                    <BsFillChatLeftTextFill /> SUB
                  </span>
                )}
                {getCurrentSpotlight()?.dub && (
                  <span className="slider-hero-badge">
                    <BsFillVolumeUpFill /> DUB
                  </span>
                )}
                {getCurrentSpotlight()?.duration && (
                  <span className="slider-hero-badge">
                    <FiClock /> {getCurrentSpotlight().duration}
                  </span>
                )}
                {getCurrentSpotlight()?.quality && (
                  <span className="slider-hero-badge">
                    <MdOutlineHd /> {getCurrentSpotlight().quality}
                  </span>
                )}
                {getCurrentSpotlight()?.releaseDate && (
                  <span className="slider-hero-badge">
                    <FiCalendar /> {getCurrentSpotlight().releaseDate}
                  </span>
                )}
              </div>

              <div className="slider-hero-desc">
                {(() => {
                  const desc = getCurrentSpotlight()?.description || '';
                  if (desc.length < 10) return desc;
                  const half = Math.ceil(desc.length / 2);
                  return desc.slice(0, half) + (desc.length > half ? '...' : '');
                })()}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="slider-hero-btn"
                  onClick={() => handleAnimeClick(getCurrentSpotlight())}
                >
                  Watch Now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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

            {/* --- TRENDING FIRST --- */}
            {trendingData.length > 0 && (
              <section className="mb-20 relative" style={{ marginTop: '-2rem' }}>
                {/* Prev/Next buttons */}
                <button
                  aria-label="previous"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-3 rounded-r-lg shadow-lg"
                  onClick={handleTrendingPrev}
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  aria-label="next"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-3 rounded-l-lg shadow-lg"
                  onClick={handleTrendingNext}
                >
                  <FiChevronRight size={20} />
                </button>

                <div className="w-full overflow-hidden" id="trending-scroll-container">
                  <div
                    className={`flex gap-3 pl-6 pr-6 pb-4 transition-transform duration-500 ease-in-out`}
                    style={{
                      width: `${trendingData.length * (220 + 12)}px`,
                      transform: `translateX(-${trendingSlideIndex * (220 + 12)}px)`
                    }}
                  >
                    {trendingData.map((anime, index) => (
                      <div key={`trending-${index}`} className="flex-shrink-0 group relative">
                        <div
                          onClick={() => handleAnimeClick(anime)}
                          className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-[180px] h-[240px] md:w-[220px] md:h-[300px]"
                        >
                          {/* Vertical rotated title */}
                          <div className="absolute left-[-48px] top-1/2 -translate-y-1/2 w-48 text-center pointer-events-none">
                            <div className="text-pink-200 font-bold text-sm transform -rotate-90 origin-left whitespace-nowrap">
                              {anime.title}
                            </div>
                          </div>

                          <img src={anime.image || '/placeholder-anime.jpg'} alt={anime.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute top-3 left-3">
                            <div className="text-white text-4xl font-black leading-none opacity-90">
                              {String(anime.number || index + 1).padStart(2, '0')}
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex gap-2 mb-2">
                              {typeof anime.sub !== 'undefined' && anime.sub !== null && (
                                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full border border-white/20">SUB: {anime.sub}</span>
                              )}
                              {typeof anime.dub !== 'undefined' && anime.dub !== null && (
                                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full border border-white/20">DUB: {anime.dub}</span>
                              )}
                            </div>
                            <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">{anime.title}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* --- THEN TOP AIRING / POPULAR / FAVORITE --- */}
            {homeData && Array.isArray(homeData) && (
              <section className="mt-10">
                <AnimeSections data={homeData} />
              </section>
            )}


            {/* --- LATEST + LEADERBOARD --- */}
            {(recentSub.length > 0 || recentDub.length > 0) && (
              <section className="mb-16">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className="flex-1 flex flex-col gap-8">
                    <div className="bg-black/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 shadow-xl">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {recentSub.map((anime, index) => (
                          <LatestAnimeCard
                            key={`recent-sub-${anime.slug || anime.title || index}`}
                            anime={anime}
                            rank={index + 1}
                            onClick={() => handleAnimeClick(anime)}
                          />
                        ))}
                        {recentDub.map((anime, index) => (
                          <LatestAnimeCard
                            key={`recent-dub-${anime.slug || anime.title || index}`}
                            anime={anime}
                            rank={recentSub.length + index + 1}
                            onClick={() => handleAnimeClick(anime)}
                          />
                        ))}
                      </div>
                    </div>
                    <ScheduleSection />
                  </div>
                  <div className="w-full md:w-[360px] md:min-w-[320px]">
                    <Leaderboard />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;
