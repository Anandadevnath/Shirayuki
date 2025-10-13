import React, { useState, useEffect } from 'react';
import { FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineHd } from 'react-icons/md';
import { BsFillVolumeUpFill, BsFillChatLeftTextFill } from 'react-icons/bs';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import AnimeCard from '../components/AnimeCard';
import TrendingCard from '../components/TrendingCard';
import SectionHeader from '../components/SectionHeader';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { getHomepage, loading, error, clearError } = useShirayukiAPI();
  const [homeData, setHomeData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  // For drag/swipe
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  // For slide animation
  const [slideDirection, setSlideDirection] = useState('right');
  const [slideAnimClass, setSlideAnimClass] = useState('');
  // Mouse/touch event handlers for slider drag
  const handleDragStart = (e) => {
    setDragging(true);
    if (e.type === 'touchstart') {
      setDragStartX(e.touches[0].clientX);
    } else {
      setDragStartX(e.clientX);
    }
  };

  const handleDragMove = (e) => {
    if (!dragging || dragStartX === null) return;
    let clientX;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    const diff = clientX - dragStartX;
    // Only trigger if drag is significant (e.g., 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleSlideChange('prev');
      } else {
        handleSlideChange('next');
      }
      setDragging(false);
      setDragStartX(null);
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
    setDragStartX(null);
  };
  // Only slider section animes for the spotlight/slider
  const sliderData = Array.isArray(homeData) ? homeData.filter(a => a.section === 'slider') : [];
  const navigate = useNavigate();

  useEffect(() => {
    if (!sliderData || sliderData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderData]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      clearError(); // Clear any previous errors
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
      setSlideDirection('right');
    } else {
      newSlide = (currentSlide - 1 + maxSlides) % maxSlides;
      setSlideDirection('left');
    }
    // Trigger animation class
    setSlideAnimClass(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    setCurrentSlide(newSlide);
  };

  const getCurrentSpotlight = () => {
    return sliderData && sliderData.length > 0 ? sliderData[currentSlide] : null;
  };

  const handleAnimeClick = (animeOrId) => {
    // Accept either an id string or an anime object
    let resolvedId = null;
    if (!animeOrId) return;

    if (typeof animeOrId === 'string') {
      resolvedId = animeOrId;
    } else if (typeof animeOrId === 'object') {
      resolvedId = animeOrId.id || animeOrId.slug || animeOrId.animeId || animeOrId._id;
    }

    console.log('Anime clicked, resolved id:', resolvedId, 'original:', animeOrId);

    if (!resolvedId) {
      return;
    }

    navigate(`/anime/${resolvedId}`);
  };


  // Reset animation class after animation ends
  useEffect(() => {
    if (!slideAnimClass) return;
    const timeout = setTimeout(() => setSlideAnimClass(''), 500);
    return () => clearTimeout(timeout);
  }, [slideAnimClass, currentSlide]);

  if (loading && !homeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !homeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <ErrorMessage
          message={error}
          onRetry={fetchHomeData}
        />
      </div>
    );
  }

  return (
    <div className="home-full-bg bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-x-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-blue-900/10 to-indigo-900/10"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)`
      }}></div>


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
          <div className={`slider-hero-anim-wrapper ${slideAnimClass}`} style={{width: '100%', height: '100%'}}>
            <img
              className="slider-hero-bg"
              src={getCurrentSpotlight()?.image || '/placeholder-hero.jpg'}
              alt={getCurrentSpotlight()?.title}
            />
            <div className="slider-hero-overlay" />
            <div className={`slider-hero-content ${slideAnimClass}`}> 
              <div className="slider-hero-badge">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#fff2"/><path d="M7 10v4a2 2 0 002 2h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 14V8a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h6z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>#{currentSlide + 1} Spotlight</span>
              </div>
              <div className="slider-hero-title">
                {getCurrentSpotlight()?.title || 'Anime Title'}
              </div>
              {/* Meta info row */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {getCurrentSpotlight()?.sub && (
                  <span className="slider-hero-badge" style={{ background: 'rgba(30,41,59,0.7)', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <BsFillChatLeftTextFill style={{ marginRight: 4, fontSize: 15 }} /> SUB
                  </span>
                )}
                {getCurrentSpotlight()?.dub && (
                  <span className="slider-hero-badge" style={{ background: 'rgba(30,41,59,0.7)', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <BsFillVolumeUpFill style={{ marginRight: 4, fontSize: 15 }} /> DUB
                  </span>
                )}
                {getCurrentSpotlight()?.duration && (
                  <span className="slider-hero-badge" style={{ background: 'rgba(30,41,59,0.7)', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <FiClock style={{ marginRight: 4, fontSize: 15 }} /> {getCurrentSpotlight().duration}
                  </span>
                )}
                {getCurrentSpotlight()?.quality && (
                  <span className="slider-hero-badge" style={{ background: 'rgba(30,41,59,0.7)', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <MdOutlineHd style={{ marginRight: 4, fontSize: 16 }} /> {getCurrentSpotlight().quality}
                  </span>
                )}
                {getCurrentSpotlight()?.releaseDate && (
                  <span className="slider-hero-badge" style={{ background: 'rgba(30,41,59,0.7)', color: '#a78bfa', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <FiCalendar style={{ marginRight: 4, fontSize: 15 }} /> {getCurrentSpotlight().releaseDate}
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  className="slider-hero-btn"
                  onClick={() => handleAnimeClick(getCurrentSpotlight())}
                >
                  Learn More
                </button>
                {getCurrentSpotlight()?.episodes && (
                  <span className="slider-hero-badge" style={{ background: '#2563ebcc' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#fff2"/><path d="M8 12h8m-8 4h8m-8-8h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Episodes: {getCurrentSpotlight().episodes}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-black/60 to-black/80 backdrop-blur-sm -mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">

          {/* Latest Anime Section */}
          {homeData && Array.isArray(homeData) && homeData.length > 0 && (
            <section className="mb-16">
              <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
                    <h2 className="text-xl lg:text-3xl font-bold text-white">🔥 Latest Anime</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2 sm:px-0">
                  {homeData.slice(0, 18).map((anime, index) => (
                    <div key={`${anime.href || 'anime'}-${index}`} className="group">
                      <div 
                        className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => handleAnimeClick(anime.href)}
                      >
                        <div className="aspect-[3/4] relative">
                          <img
                            src={anime.image || '/placeholder-anime.jpg'}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            #{index + 1}
                          </div>
                          {anime.dub && (
                            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                              {anime.dub} EP
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">
                            {anime.title}
                          </h3>
                          <div className="text-xs text-gray-400">
                            Click to view details
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Show All Anime Section */}
          {homeData && Array.isArray(homeData) && homeData.length > 0 && (
            <section className="mb-16">
              <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <h2 className="text-xl lg:text-3xl font-bold text-white">📚 All Anime ({homeData.length})</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {homeData.map((anime, index) => (
                    <div key={`${anime.href || 'anime'}-${index}`} className="group">
                      <div 
                        className="bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl"
                        onClick={() => handleAnimeClick(anime.href)}
                      >
                        <div className="aspect-[3/4] relative">
                          <img
                            src={anime.image || '/placeholder-anime.jpg'}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                            #{index + 1}
                          </div>
                          {anime.dub && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                              {anime.dub}
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5v10l7-5z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1 group-hover:text-pink-300 transition-colors">
                            {anime.title}
                          </h3>
                          <div className="text-xs text-gray-400">
                            Click to watch
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;