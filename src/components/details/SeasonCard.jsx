import { memo } from "react";
import { Link } from "react-router-dom";

export const SeasonCard = memo(function SeasonCard({ season }) {
  return (
    <Link
      to={`/anime/${season.id}`}
      className={`flex-shrink-0 w-24 text-center group ${
        season.isCurrent ? "ring-2 ring-pink-500 rounded-lg" : ""
      }`}
    >
      <img
        src={season.poster}
        alt={season.name}
        className="w-24 h-32 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
      />
      <p className="text-xs text-zinc-400 mt-1 truncate">{season.title}</p>
    </Link>
  );
});
