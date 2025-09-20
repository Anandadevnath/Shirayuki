import React, { useState, useEffect } from 'react';
import { useAPI } from '../context/APIContext';
import AnimeCard from '../components/AnimeCard';
import TrendingCard from '../components/TrendingCard';
import SectionHeader from '../components/SectionHeader';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';

function Home() {
  const { api, isLoading, error } = useAPI();
  const [homeData, setHomeData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-x-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-blue-900/10 to-indigo-900/10"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.08) 0%, transparent 60%),
                         radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)`
      }}></div>
      
      {/* Modern Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-xl shadow-lg">
                HiAnime
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search for anime..."
                  className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/60 px-6 py-3 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 pl-12"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

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

                <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  {getCurrentSpotlight()?.name}
                </h1>
                
                {/* Tags */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {getCurrentSpotlight()?.rank || 'TOP RATED'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/30">
                    {getCurrentSpotlight()?.releaseDate || '2025'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/30">
                    {getCurrentSpotlight()?.type || 'TV Series'}
                  </span>
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {getCurrentSpotlight()?.quality || 'HD'}
                  </span>
                </div>

                <p className="text-gray-300 text-xl leading-relaxed mb-8 line-clamp-3 max-w-2xl">
                  {getCurrentSpotlight()?.description || "Experience an incredible journey filled with adventure, friendship, and unforgettable moments in this amazing anime series."}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
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
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
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
                    <h2 className="text-3xl font-bold text-white">🔥 Trending Now</h2>
                  </div>
                  <button className="text-pink-400 hover:text-pink-300 font-semibold transition-colors flex items-center gap-2">
                    View All 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {homeData.data.trendingAnimes.slice(0, 12).map((anime, index) => (
                    <div key={anime.id || index} className="group">
                      <AnimeCard
                        anime={anime}
                        rank={index + 1}
                        size="medium"
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
                        <div key={anime.id || index} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} />
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
                        <div key={anime.id || index} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} />
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
                        <div key={anime.id || index} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} />
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
                        <div key={anime.id || index} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} />
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
                        <div key={anime.id || index} className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300">
                          <TrendingCard anime={anime} rank={index + 1} />
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
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {homeData.data.recentlyUpdated.slice(0, 12).map((anime, index) => (
                    <div key={anime.id || index} className="group">
                      <AnimeCard
                        anime={anime}
                        showProgress={true}
                        size="medium"
                      />
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