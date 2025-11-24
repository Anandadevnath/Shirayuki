import React from 'react';

const LatestAnimeCard = ({ anime, rank, onClick }) => {
  const sub = typeof anime.sub !== 'undefined' ? anime.sub : anime.episodes?.sub;
  const dub = typeof anime.dub !== 'undefined' ? anime.dub : anime.episodes?.dub;
  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl bg-black/40 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer hover:scale-105 group w-full aspect-[2/3]"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
    >
      {/* Anime Image */}
      <div className="relative w-full h-full">
        <img
          src={anime.image || '/placeholder-anime.jpg'}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Blur overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-md z-20" />
        {/* Glassy play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          <div className="bg-white/20 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-white/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <polygon points="8,6 15,10 8,14" fill="white" />
            </svg>
          </div>
        </div>
        {/* Episode Badge: show both dub and sub if available */}
        {(sub || dub) && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center z-30 shadow-md border border-white/20">
            <span className="text-white text-xs font-extrabold leading-none tracking-wider drop-shadow-md" style={{letterSpacing: '0.05em'}}>
              {dub ? `dub: ${dub}` : ''}
              {dub && sub ? ' ' : ''}
              {sub ? `sub: ${sub}` : ''}
            </span>
          </div>
        )}
        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-sm font-bold z-30 shadow-lg">
            #{rank}
          </div>
        )}
        {/* Bottom Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 py-3 z-30">
          <h3 className="text-white font-bold text-base line-clamp-2 drop-shadow-md">{anime.title}</h3>
        </div>
      </div>
    </div>
  );
};

export default LatestAnimeCard;
