import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const TrendingSection = ({
  trendingData,
  trendingSlideIndex,
  handleTrendingPrev,
  handleTrendingNext,
  handleAnimeClick
}) => (
  trendingData.length > 0 && (
    <section className="mb-20 relative" style={{ marginTop: '-2rem' }}>
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
            width: `${(trendingData.length * 2) * (220 + 12)}px`,
            transform: `translateX(-${(trendingSlideIndex % trendingData.length) * (220 + 12)}px)`
          }}
        >
          {/* Duplicate the trending data for infinite scroll effect */}
          {[...trendingData, ...trendingData].map((anime, index) => (
            <div key={`trending-${index}`} className="flex-shrink-0 group relative">
              <div
                onClick={() => handleAnimeClick(anime)}
                className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-[180px] h-[240px] md:w-[220px] md:h-[300px]"
              >
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
  )
);

export default TrendingSection;
