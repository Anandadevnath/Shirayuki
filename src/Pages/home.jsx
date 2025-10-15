import React, { useState, useEffect } from 'react';
import { FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineHd } from 'react-icons/md';
import { BsFillVolumeUpFill, BsFillChatLeftTextFill } from 'react-icons/bs';
import '../styles/sliderHero.css';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { getHomepage, loading, error, clearError } = useShirayukiAPI();
  const [homeData, setHomeData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);
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
  const sliderData = Array.isArray(homeData) ? homeData.filter(a => a.section === 'slider') : [];
  const navigate = useNavigate();

  useEffect(() => {
    if (!sliderData || sliderData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderData]);

  // Auto-scroll trending section with infinite loop
  useEffect(() => {
    const trendingData = homeData?.filter(anime => anime.section === 'trending') || [];
    if (trendingData.length <= 1) return;

    const interval = setInterval(() => {
      setTrendingSlideIndex((prev) => {
        const nextIndex = prev + 1;
        
        // When we reach the end of the first set, reset to 0 for seamless loop
        if (nextIndex >= trendingData.length) {
          // Use setTimeout to reset without transition for seamless loop
          setTimeout(() => {
            const container = document.querySelector('#trending-scroll-container .flex');
            if (container) {
              container.style.transition = 'none';
              container.style.transform = 'translateX(0px)';
              // Re-enable transition after reset
              setTimeout(() => {
                container.style.transition = 'transform 500ms ease-in-out';
              }, 50);
            }
          }, 500);
          return 0;
        }
        
        return nextIndex;
      });
    }, 2000); // Change slide every 2 seconds

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
    // Trigger animation class
    setSlideAnimClass(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    setCurrentSlide(newSlide);
  };

  const getCurrentSpotlight = () => {
    return sliderData && sliderData.length > 0 ? sliderData[currentSlide] : null;
  };

  const handleAnimeClick = (animeOrId) => {
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


  useEffect(() => {
    if (!slideAnimClass) return;
    const timeout = setTimeout(() => setSlideAnimClass(''), 500);
    return () => clearTimeout(timeout);
  }, [slideAnimClass, currentSlide]);

  if (loading && !homeData) {
    return (
      <div className="home-full-bg relative overflow-x-hidden" style={{ background: '#000000' }}>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error && !homeData) {
    return (
      <div className="home-full-bg relative overflow-x-hidden" style={{ background: '#000000' }}>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <ErrorMessage
            message={error}
            onRetry={fetchHomeData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="home-full-bg relative overflow-x-hidden" style={{
      background: '#000000'
    }}>
      <div className="absolute inset-0" style={{
        background: 'transparent'
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
            <div className={`slider-hero-content ${slideAnimClass}`} style={{marginLeft: 'calc(4rem + 1.5rem)'}}> 
              <div className="slider-hero-badge">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#fff2"/><path d="M7 10v4a2 2 0 002 2h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 14V8a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h6z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>#{currentSlide + 1} Spotlight</span>
              </div>
              <div className="slider-hero-title">
                {getCurrentSpotlight()?.title || 'Anime Title'}
              </div>
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
                  Watch Now
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
      <div className="relative z-10" style={{ marginTop: '-20vh' }}>
        <div className="relative">
          {/* Blend transition area */}
          <div 
            className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, 
                rgba(0,0,0,0) 0%, 
                rgba(0,0,0,0.1) 10%, 
                rgba(0,0,0,0.3) 30%, 
                rgba(0,0,0,0.6) 60%, 
                rgba(0,0,0,0.9) 90%, 
                rgba(0,0,0,1) 100%
              )`
            }}
          ></div>
          
          <div className="max-w-7xl mx-auto px-6 py-12 pt-32 relative z-10">

          {/* Trending Section */}
          {homeData && Array.isArray(homeData) && homeData.filter(anime => anime.section === 'trending').length > 0 && (
            <section className="mb-16">
              <div className="max-w-7xl mx-auto px-6 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl lg:text-4xl font-bold text-white">Trending</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {homeData.filter(anime => anime.section === 'trending').map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === trendingSlideIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-hidden" id="trending-scroll-container">
                <div 
                  className="flex gap-3 pl-6 pr-6 pb-4 transition-transform duration-500 ease-in-out" 
                  style={{ 
                    width: `${homeData.filter(anime => anime.section === 'trending').length * 2 * (220 + 12)}px`,
                    transform: `translateX(-${trendingSlideIndex * (220 + 12)}px)`
                  }}
                >
                  {/* First set of anime cards */}
                  {homeData
                    .filter(anime => anime.section === 'trending')
                    .map((anime, index) => (
                      <div key={`trending-1-${anime.href || 'anime'}-${index}`} className="flex-shrink-0 group relative">
                        <div 
                          className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                          onClick={() => handleAnimeClick(anime.href)}
                          style={{ width: '220px', height: '300px' }}
                        >
                          <img
                            src={anime.image || '/placeholder-anime.jpg'}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          
                          {/* Ranking Number - positioned like in the image */}
                          <div className="absolute top-3 left-3">
                            <div className="text-white text-4xl font-black leading-none opacity-90" style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
                            }}>
                              {String(anime.number || index + 1).padStart(2, '0')}
                            </div>
                          </div>

                          {/* Title at bottom */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">
                              {anime.title}
                            </h3>
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5v10l7-5z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Duplicate set for infinite loop effect */}
                  {homeData
                    .filter(anime => anime.section === 'trending')
                    .map((anime, index) => (
                      <div key={`trending-2-${anime.href || 'anime'}-${index}`} className="flex-shrink-0 group relative">
                        <div 
                          className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                          onClick={() => handleAnimeClick(anime.href)}
                          style={{ width: '220px', height: '300px' }}
                        >
                          <img
                            src={anime.image || '/placeholder-anime.jpg'}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          
                          {/* Ranking Number - positioned like in the image */}
                          <div className="absolute top-3 left-3">
                            <div className="text-white text-4xl font-black leading-none opacity-90" style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
                            }}>
                              {String(anime.number || index + 1).padStart(2, '0')}
                            </div>
                          </div>

                          {/* Title at bottom */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">
                              {anime.title}
                            </h3>
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5v10l7-5z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Latest Anime Section */}
          {homeData && Array.isArray(homeData) && homeData.length > 0 && (
            <section className="mb-16">
              <div className="bg-black/10 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-xl">
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
              <div className="bg-black/10 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-xl">
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
    </div>
  );
}

export default Home;