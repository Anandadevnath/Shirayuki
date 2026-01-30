import { memo } from "react";
import { Link } from "react-router-dom";

export const SmallAnimeCard = memo(function SmallAnimeCard({ anime, index }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300 shadow-lg group-hover:shadow-pink-500/50">
        {/* Image */}
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        
        {/* Ranking Badge - Top Left */}
        {index !== undefined && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            #{index + 1}
          </div>
        )}
        
        {/* Type Badge - Top Right */}
        {anime.type && (
          <div className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-lg">
            {anime.type}
          </div>
        )}
        
        {/* Episode Badges - Bottom Left */}
        {anime.episodes && (
          <div className="absolute bottom-14 left-3 flex flex-row gap-1.5 z-10 flex-nowrap">
            {anime.episodes.sub && (
              <div className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1.5 rounded w-fit whitespace-nowrap">
                SUB {anime.episodes.sub}
              </div>
            )}
            {anime.episodes.dub && (
              <div className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded w-fit whitespace-nowrap">
                DUB {anime.episodes.dub}
              </div>
            )}
          </div>
        )}
        
        {/* Title - Bottom */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-pink-300 transition-colors">
            {anime.name}
          </h3>
        </div>
      </div>
    </Link>
  );
});
