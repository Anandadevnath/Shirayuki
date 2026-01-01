import { memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const GenresSection = memo(function GenresSection({ genres }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link key={genre} to={`/genre/${genre.toLowerCase()}`}>
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white cursor-pointer transition-colors"
            >
              {genre}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
});
