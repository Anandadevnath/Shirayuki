import React, { useState, useEffect } from 'react';
import { useAPI } from '../context/APIContext';
import AnimeCard from '../components/AnimeCard';
import TrendingCard from '../components/TrendingCard';
import SectionHeader from '../components/SectionHeader';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { api, isLoading, error } = useAPI();
  const [homeData, setHomeData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Auto-slide for spotlight slider
  useEffect(() => {
    if (!homeData?.data?.spotlightAnimes || homeData.data.spotlightAnimes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeData.data.spotlightAnimes.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [homeData]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const data = await api.getHomePage();
      setHomeData(data);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    }
  };

  const handleSlideChange = (direction) => {
    if (!homeData?.data?.spotlightAnimes) return;

    const maxSlides = homeData.data.spotlightAnimes.length;
    let newSlide;
    if (direction === 'next') {
      newSlide = (currentSlide + 1) % maxSlides;
    } else {
      newSlide = (currentSlide - 1 + maxSlides) % maxSlides;
    }
    setCurrentSlide(newSlide);
  };

  const getCurrentSpotlight = () => {
    return homeData?.data?.spotlightAnimes?.[currentSlide];
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
      // nothing to navigate to
      return;
    }

    navigate(`/anime/${resolvedId}`);
  };

  if (isLoading && !homeData) {
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
          message={error.message}
          onRetry={fetchHomeData}
        />
      </div>
    );
  }

  return (
    <div className="lg:w-[102vw] lg:right-50 w-[101vw] right-5 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-x-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-blue-900/10 to-indigo-900/10"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)`
      }}></div>

      {/* Spotlight Slider */}
      {homeData?.data?.spotlightAnimes && (
        <section className="relative h-screen pt-20 overflow-hidden">
          {/* Background with Parallax Effect */}
          <div className="absolute inset-0">
            <img
              src={getCurrentSpotlight()?.poster || '/placeholder-hero.jpg'}
              alt={getCurrentSpotlight()?.name}
              className="w-full h-full object-cover scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-3xl">
                {/* Spotlight Indicator */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-2 rounded-full mb-6">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold text-sm">#1 SPOTLIGHT</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 leading-tight">
                  {getCurrentSpotlight()?.name}
                </h1>
                {/* Japanese name */}
                {getCurrentSpotlight()?.jname && (
                  <div className="text-lg text-pink-200 font-medium mb-4">
                    {getCurrentSpotlight().jname}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {getCurrentSpotlight()?.rank || 'TOP RATED'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/30">
                    {getCurrentSpotlight()?.type || 'TV Series'}
                  </span>
                  {/* Episodes */}
                  {getCurrentSpotlight()?.episodes && (
                    <span className="bg-blue-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold border border-blue-400/30">
                      Sub: {getCurrentSpotlight().episodes.sub} | Dub: {getCurrentSpotlight().episodes.dub}
                    </span>
                  )}
                  {/* Other Info */}
                  {Array.isArray(getCurrentSpotlight()?.otherInfo) && getCurrentSpotlight().otherInfo.map((info, idx) => (
                    <span key={idx} className="bg-white/10 text-white px-3 py-1 rounded-full text-xs border border-white/20">
                      {info}
                    </span>
                  ))}
                </div>

                {/* Release Date */}
                {getCurrentSpotlight()?.otherInfo?.[2] && (
                  <div className="text-sm text-gray-300 mb-2">
                    Release Date: {getCurrentSpotlight().otherInfo[2]}
                  </div>
                )}

                <p className="text-gray-300 text-xl leading-relaxed mb-6 line-clamp-3 max-w-2xl">
                  {getCurrentSpotlight()?.description || "Experience an incredible journey filled with adventure, friendship, and unforgettable moments in this amazing anime series."}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-2">
                  <button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l7-5z" />
                    </svg>
                    WATCH NOW
                  </button>
                  <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    ADD TO LIST
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="absolute bottom-8 right-8 flex items-center gap-4 z-10">
            <button
              onClick={() => handleSlideChange('prev')}
              className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white p-3 rounded-xl transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="bg-white/10 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-xl">
              <span className="text-white font-semibold">
                {currentSlide + 1} / {homeData?.data?.spotlightAnimes?.length || 1}
              </span>
            </div>

            <button
              onClick={() => handleSlideChange('next')}
              className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white p-3 rounded-xl transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {homeData.data.spotlightAnimes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/40 hover:bg-white/60'
                  }`}
              />
            ))}
          </div>

          {/* Fade Transition Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-20"></div>
        </section>
      )}

      {/* Main Content */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-black/60 to-black/80 backdrop-blur-sm -mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12 pt-24">

          {/* Trending Section */}
          {homeData?.data?.trendingAnimes && (
            <section className="mb-16">
              <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
                    <h2 className="text-xl lg:text-3xl font-bold text-white">🔥Trending Now</h2>
                  </div>

                </div>

                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 px-2 sm:px-0 items-stretch">
                  {homeData.data.trendingAnimes.slice(0, 12).map((anime, index) => (
                    <div key={`${anime.id || 'anime'}-${index}`} className="group h-full flex flex-col min-w-0">
                      <AnimeCard
                        anime={anime}
                        rank={index + 1}
                        size="medium"
                        className="h-40 sm:h-48 md:h-56 aspect-[3/4] flex flex-col justify-between min-w-0"
                        onClick={() => handleAnimeClick(anime.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Category Tabs Section */}
          <section className="mb-16">
            <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div className="grid grid-auto-fit gap-6 equal-height">

                {/* Top Airing */}
                {homeData?.data?.topAiringAnimes && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Top Airing</h3>
                    </div>
                    <div className="space-y-3">
                      {homeData.data.topAiringAnimes.slice(0, 10).map((anime, index) => (
                        <div key={`${anime.id || 'anime'}-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} onClick={() => handleAnimeClick(anime.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Popular */}
                {homeData?.data?.mostPopular && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Most Popular</h3>
                    </div>
                    <div className="space-y-3">
                      {homeData.data.mostPopular.slice(0, 10).map((anime, index) => (
                        <div key={`${anime.id || 'anime'}-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} onClick={() => handleAnimeClick(anime.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Favorite */}
                {homeData?.data?.mostFavorite && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Most Favorite</h3>
                    </div>
                    <div className="space-y-3">
                      {homeData.data.mostFavorite.slice(0, 10).map((anime, index) => (
                        <div key={`${anime.id || 'anime'}-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} onClick={() => handleAnimeClick(anime.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Episode Animes */}
                {homeData?.data?.latestEpisodeAnimes && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Latest Episodes</h3>
                    </div>
                    <div className="space-y-3">
                      {homeData.data.latestEpisodeAnimes.slice(0, 10).map((anime, index) => (
                        <div key={`${anime.id || 'anime'}-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} onClick={() => handleAnimeClick(anime.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Upcoming Animes */}
                {homeData?.data?.topUpcomingAnimes && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-amber-500 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Upcoming</h3>
                    </div>
                    <div className="space-y-3">
                      {homeData.data.topUpcomingAnimes.slice(0, 10).map((anime, index) => (
                        <div key={`${anime.id || 'anime'}-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} onClick={() => handleAnimeClick(anime.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Continue Watching Section */}
          {homeData?.data?.recentlyUpdated && (
            <section className="mb-16">
              <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-yellow-500 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-white">Continue Watching</h2>
                  </div>
                  <button className="text-orange-400 hover:text-orange-300 font-semibold transition-colors flex items-center gap-2">
                    View All
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2 sm:px-0">
                  {homeData.data.recentlyUpdated.slice(0, 12).map((anime, index) => (
                    <div key={`${anime.id || 'anime'}-${index}`} className="relative rounded-2xl shadow-lg border border-white/10 bg-black/40 overflow-hidden group flex flex-col h-40 sm:h-48 md:h-56 min-w-0 m-2">
                      {/* Badge */}
                      {anime.isAdult && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">18+</span>
                      )}
                      {/* Close Button */}
                      <button className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center z-10 shadow-md hover:bg-black/80">
                        &#10005;
                      </button>
                      {/* Anime Image */}
                      <img src={anime.poster || '/placeholder-anime.svg'} alt={anime.name} className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-t-2xl" />
                      {/* Card Content */}
                      <div className="p-3">
                        <div className="flex flex-wrap gap-2 mb-1">
                          {/* Progress Badges */}
                          {anime.progress && (
                            <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded font-semibold">{anime.progress.sub}</span>
                          )}
                          {anime.progress && (
                            <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded font-semibold">{anime.progress.dub}</span>
                          )}
                        </div>
                        <div className="font-bold text-white text-base leading-tight mb-1 line-clamp-2">{anime.name}</div>
                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                          <span>EP {anime.episode || '--'}</span>
                          <span className="font-bold text-pink-400">{anime.progressTime || '--:--'} / {anime.totalTime || '--:--'}</span>
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