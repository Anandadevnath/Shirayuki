import { memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Anime Card Component (overlay style for trending/scroll sections)
export const AnimeCard = memo(function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-md sm:rounded-md aspect-[2/3]">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {anime.rank && (
          <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-purple-600 hover:bg-purple-700 text-[10px] sm:text-xs">
            #{anime.rank}
          </Badge>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="font-semibold text-white truncate text-xs sm:text-sm mb-1 sm:mb-2">{anime.name}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {anime.episodes?.sub && (
              <Badge className="bg-pink-500/90 hover:bg-pink-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3 sm:h-3">
                  <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
                {anime.episodes.sub}
              </Badge>
            )}
            {anime.type && (
              <span className="text-zinc-400 text-[10px] sm:text-xs">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

// Anime Card Component (grid style with info inside card)
export const AnimeGridCard = memo(function AnimeGridCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-orange-400 transition-colors">
            {anime.name}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {anime.episodes?.sub && (
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded">
                CC {anime.episodes.sub}
              </Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-green-600 hover:bg-green-600 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5">
                🎙️ {anime.episodes.dub}
              </Badge>
            )}
            {anime.type && (
              <span className="text-zinc-300 text-[10px] sm:text-xs ml-auto">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
