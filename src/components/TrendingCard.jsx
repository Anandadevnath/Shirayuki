import React from 'react';

const TrendingCard = ({ anime, rank, onClick }) => {
  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') onClick();
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/20" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={handleKeyDown}>
      {/* Rank */}
      <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent min-w-[2.5rem] group-hover:scale-110 transition-transform">
        {rank}
      </div>
      
      {/* Poster */}
      <div className="w-14 h-20 flex-shrink-0 relative overflow-hidden rounded-lg">
        <img
          src={anime?.poster || anime?.image || '/placeholder-anime.svg'}
          alt={anime?.name || anime?.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.target.src = '/placeholder-anime.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white text-sm font-bold line-clamp-2 mb-2 group-hover:text-pink-300 transition-colors">
          {anime?.name || anime?.title}
        </h4>
        
        <div className="flex flex-wrap gap-1">
          {anime?.type && (
            <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 px-2 py-1 rounded-full text-xs font-semibold">
              {anime.type}
            </span>
          )}
          {anime?.quality && (
            <span className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 px-2 py-1 rounded-full text-xs font-semibold">
              {anime.quality}
            </span>
          )}
        </div>
      </div>
      
      {/* Hover Arrow */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default TrendingCard;