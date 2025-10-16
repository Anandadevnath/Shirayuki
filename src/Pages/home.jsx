import React, { useState, useEffect } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';
import ScheduleSection from '../components/ScheduleSection.jsx';
import LatestAnimeCard from '../components/LatestAnimeCard.jsx';
import { FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineHd } from 'react-icons/md';
import { BsFillVolumeUpFill, BsFillChatLeftTextFill } from 'react-icons/bs';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useNavigate } from 'react-router-dom';
import AnimeSections from '../components/AnimeSections';

function Home() {
  const { getHomepage, loading, error, clearError } = useShirayukiAPI();
  const [homeData, setHomeData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);
  const navigate = useNavigate();

  const handleDragStart = (e) => {
    setDragging(true);
    setDragStartX(e.type === 'touchstart' ? e.touches[0].clientX : e.clientX);
  };

  const handleDragMove = (e) => {
    if (!dragging || dragStartX === null) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    if (Math.abs(diff) > 50) {
      handleSlideChange(diff > 0 ? 'prev' : 'next');
      setDragging(false);
      setDragStartX(null);
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
    setDragStartX(null);
  };

  const sliderData = Array.isArray(homeData)
    ? homeData.filter((a) => a.section === 'slider')
    : [];

  useEffect(() => {
    if (!sliderData || sliderData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderData]);

  useEffect(() => {
    const trendingData = homeData?.filter((anime) => anime.section === 'trending') || [];
    if (trendingData.length <= 1) return;

    const CARD_WIDTH = 220 + 12;
    const CONTAINER_WIDTH = window.innerWidth * 0.9;
    const visibleCards = Math.floor(CONTAINER_WIDTH / CARD_WIDTH);
    const maxIndex = Math.max(0, trendingData.length - visibleCards);

    const interval = setInterval(() => {
      setTrendingSlideIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex > maxIndex) {
          return 0;
        }
        return nextIndex;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [homeData]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      clearError();
      const data = await getHomepage();
      setHomeData(data?.data || []);
      console.log('Home data fetched successfully:', data);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    }
  };

  const handleSlideChange = (direction) => {
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
  };

  const getCurrentSpotlight = () => {
    return sliderData && sliderData.length > 0
      ? sliderData[currentSlide]
      : null;
  };

  const handleAnimeClick = (animeOrId) => {
    let resolvedId = null;
    if (!animeOrId) return;
    if (typeof animeOrId === 'string') {
      resolvedId = animeOrId;
    } else if (typeof animeOrId === 'object') {
      resolvedId = animeOrId.japanese || animeOrId.title || animeOrId.id || animeOrId.slug || animeOrId.animeId || animeOrId._id;
    }
    if (!resolvedId) return;
    navigate(`/anime/${encodeURIComponent(resolvedId)}`);
  };

  useEffect(() => {
    if (!slideAnimClass) return;
    const timeout = setTimeout(() => setSlideAnimClass(''), 500);
    return () => clearTimeout(timeout);
  }, [slideAnimClass, currentSlide]);

  if (loading && !homeData) {
    return (
      <div
        className="home-full-bg relative overflow-x-hidden"
        style={{ background: '#000000' }}
      >
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error && !homeData) {
    return (
      <div
        className="home-full-bg relative overflow-x-hidden"
        style={{ background: '#000000' }}
      >
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <ErrorMessage message={error} onRetry={fetchHomeData} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="home-full-bg relative overflow-x-hidden"
      style={{ background: '#000', minHeight: '100vh', width: '100vw', position: 'relative', zIndex: 0 }}
    >
      <div className="absolute inset-0" style={{ background: 'transparent' }} />

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
          <div
            className={`slider-hero-anim-wrapper ${slideAnimClass}`}
            style={{ width: '100%', height: '100%' }}
          >
            <img
              className="slider-hero-bg"
              src={getCurrentSpotlight()?.image || '/placeholder-hero.jpg'}
              alt={getCurrentSpotlight()?.title}
            />
            <div className="slider-hero-overlay" />
            <div
              className={`slider-hero-content ${slideAnimClass}`}
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

          <div className="max-w-[90vw] mx-auto px-6 py-12 pt-32 relative z-10">

            {/* --- TRENDING FIRST --- */}
            {homeData &&
              Array.isArray(homeData) &&
              homeData.filter((anime) => anime.section === 'trending').length >
              0 && (
                <section className="mb-20" style={{ marginTop: '-2rem' }}>
                  <div className="w-full overflow-hidden" id="trending-scroll-container">
                    <div
                      className="flex gap-3 pl-6 pr-6 pb-4 transition-transform duration-500 ease-in-out"
                      style={{
                        width: `${homeData.filter((anime) => anime.section === 'trending').length * (220 + 12)
                          }px`,
                        transform: `translateX(-${trendingSlideIndex * (220 + 12)}px)`
                      }}
                    >
                      {homeData
                        .filter((anime) => anime.section === 'trending')
                        .map((anime, index) => (
                          <div
                            key={`trending-${index}`}
                            className="flex-shrink-0 group relative"
                          >
                            <div
                              onClick={() => handleAnimeClick(anime)}
                              className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-[180px] h-[240px] md:w-[220px] md:h-[300px]"
                            >
                              <img
                                src={anime.image || '/placeholder-anime.jpg'}
                                alt={anime.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 left-3">
                                <div className="text-white text-4xl font-black leading-none opacity-90">
                                  {String(anime.number || index + 1).padStart(
                                    2,
                                    '0'
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">
                                  {anime.title}
                                </h3>
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
            {homeData && Array.isArray(homeData) && homeData.length > 0 && (
              <section className="mb-16">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className="flex-1 flex flex-col gap-8">
                    <div className="bg-black/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 shadow-xl">
                      <h2 className="text-3xl font-bold text-white mb-8" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Fire Icon SVG for better consistency */}
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <path d="M16 2C16 2 13 7 13 10C13 13 16 15 16 15C16 15 19 13 19 10C19 7 16 2 16 2Z" fill="#FF9800" />
                          <path d="M16 15C16 15 10 17 10 22C10 26 16 30 16 30C16 30 22 26 22 22C22 17 16 15 16 15Z" fill="#FF5252" />
                        </svg>
                        <span style={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
                          <span style={{ fontWeight: 'bold' }}>Recently Updated</span>
                          <span style={{
                            display: 'inline-block',
                            position: 'absolute',
                            left: '110%',
                            top: '50%',
                            width: '580px',
                            height: '4px',
                            background: '#ef4444',
                            borderRadius: '2px',
                            transform: 'translateY(-50%)',
                            marginLeft: '12px',
                          }}></span>
                        </span>
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {homeData.filter(anime => anime.section === 'recently_updated').slice(0, 18).map((anime, index) => (
                          <LatestAnimeCard
                            key={`${anime.slug || anime.title || 'anime'}-${index}`}
                            anime={anime}
                            rank={index + 1}
                            onClick={() => handleAnimeClick(anime)}
                          />
                        ))}
                      </div>
                    </div>
                    <ScheduleSection />
                  </div>
                  <div className="w-full md:w-[360px] md:min-w-[320px]">
                    {/* Leaderboard Section */}
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
