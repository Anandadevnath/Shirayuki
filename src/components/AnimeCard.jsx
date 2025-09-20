import React from 'react';

const AnimeCard = ({ anime, showProgress = false, rank = null, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-40 h-60',
    large: 'w-48 h-72'
  };

  return (
    <div className="relative group cursor-pointer">
      {/* Rank Badge */}
      {rank && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10 shadow-lg">
          #{rank}
        </div>
      )}
      
      {/* Main Card */}
      <div className={`${sizeClasses[size]} relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-500 group-hover:scale-105 group-hover:bg-white/20 shadow-xl`}>
        {/* Poster Image */}
        <img
          src={anime?.poster || anime?.image || '/placeholder-anime.jpg'}
          alt={anime?.name || anime?.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = '/placeholder-anime.jpg';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-sm font-bold line-clamp-2 mb-2 group-hover:text-pink-300 transition-colors">
            {anime?.name || anime?.title}
          </h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {anime?.type && (
              <span className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold border border-green-400/30">
                {anime.type}
              </span>
            )}
            {anime?.quality && (
              <span className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold border border-blue-400/30">
                {anime.quality}
              </span>
            )}
          </div>
          
          {/* Episodes Info */}
          {anime?.episodes && (
            <p className="text-gray-300 text-xs mb-2">
              {anime.episodes?.sub && `Sub: ${anime.episodes.sub}`}
              {anime.episodes?.sub && anime.episodes?.dub && ' • '}
              {anime.episodes?.dub && `Dub: ${anime.episodes.dub}`}
            </p>
          )}
          
          {/* Progress Bar for Continue Watching */}
          {showProgress && anime?.progress && (
            <div className="mt-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full h-2 border border-white/30">
                <div 
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full shadow-lg" 
                  style={{ width: `${anime.progress}%` }}
                />
              </div>
              <p className="text-gray-300 text-xs mt-2">
                Episode {anime.currentEpisode || 1} of {anime.totalEpisodes || '?'}
              </p>
            </div>
          )}
        </div>
        
        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-4 shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l7-5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;