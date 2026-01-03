import { Button } from "@/components/ui/button";

const genres = [
  "action", "adventure", "cars", "comedy", "dementia", "demons", "drama",
  "ecchi", "fantasy", "game", "harem", "hentai", "historical", "horror",
  "isekai", "josei", "kids", "magic", "martial-arts", "mecha", "military",
  "music", "mystery", "parody", "police", "psychological", "romance",
  "samurai", "school", "sci-fi", "seinen", "shoujo", "shoujo-ai", "shounen",
  "shounen-ai", "slice-of-life", "space", "sports", "super-power",
  "supernatural", "thriller", "vampire"
];

const glow = {
  action: 'hover:text-red-400 hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]',
  adventure: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  cars: 'hover:text-orange-400 hover:shadow-[0_0_8px_2px_rgba(251,191,36,0.7)]',
  comedy: 'hover:text-blue-400 hover:shadow-[0_0_8px_2px_rgba(96,165,250,0.7)]',
  dementia: 'hover:text-cyan-300 hover:shadow-[0_0_8px_2px_rgba(103,232,249,0.7)]',
  demons: 'hover:text-pink-300 hover:shadow-[0_0_8px_2px_rgba(249,168,212,0.7)]',
  drama: 'hover:text-cyan-400 hover:shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]',
  ecchi: 'hover:text-pink-300 hover:shadow-[0_0_8px_2px_rgba(249,168,212,0.7)]',
  fantasy: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  game: 'hover:text-red-400 hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]',
  harem: 'hover:text-yellow-300 hover:shadow-[0_0_8px_2px_rgba(253,224,71,0.7)]',
  hentai: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  historical: 'hover:text-green-300 hover:shadow-[0_0_8px_2px_rgba(134,239,172,0.7)]',
  horror: 'hover:text-red-400 hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]',
  isekai: 'hover:text-green-300 hover:shadow-[0_0_8px_2px_rgba(134,239,172,0.7)]',
  josei: 'hover:text-green-400 hover:shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]',
  kids: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  magic: 'hover:text-orange-400 hover:shadow-[0_0_8px_2px_rgba(251,191,36,0.7)]',
  'martial-arts': 'hover:text-orange-300 hover:shadow-[0_0_8px_2px_rgba(253,186,116,0.7)]',
  mecha: 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  military: 'hover:text-orange-300 hover:shadow-[0_0_8px_2px_rgba(253,186,116,0.7)]',
  music: 'hover:text-green-300 hover:shadow-[0_0_8px_2px_rgba(134,239,172,0.7)]',
  mystery: 'hover:text-lime-300 hover:shadow-[0_0_8px_2px_rgba(190,242,100,0.7)]',
  parody: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  police: 'hover:text-red-400 hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]',
  psychological: 'hover:text-lime-300 hover:shadow-[0_0_8px_2px_rgba(190,242,100,0.7)]',
  romance: 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  samurai: 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  school: 'hover:text-green-300 hover:shadow-[0_0_8px_2px_rgba(134,239,172,0.7)]',
  'sci-fi': 'hover:text-lime-300 hover:shadow-[0_0_8px_2px_rgba(190,242,100,0.7)]',
  seinen: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  shoujo: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  'shoujo-ai': 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  shounen: 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  'shounen-ai': 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  'slice-of-life': 'hover:text-green-300 hover:shadow-[0_0_8px_2px_rgba(134,239,172,0.7)]',
  space: 'hover:text-lime-300 hover:shadow-[0_0_8px_2px_rgba(190,242,100,0.7)]',
  sports: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  'super-power': 'hover:text-orange-400 hover:shadow-[0_0_8px_2px_rgba(251,191,36,0.7)]',
  supernatural: 'hover:text-blue-300 hover:shadow-[0_0_8px_2px_rgba(147,197,253,0.7)]',
  thriller: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
  vampire: 'hover:text-pink-400 hover:shadow-[0_0_8px_2px_rgba(244,114,182,0.7)]',
};

export default function GenreFilter({ genreId, onGenreClick }) {
  const handleClick = (genre) => {
    if (onGenreClick) {
      onGenreClick(genre);
    } else {
      window.location.href = `/genre/${genre}`;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {genres.map((genre) => (
        <Button
          key={genre}
          variant="outline"
          size="sm"
          onClick={() => handleClick(genre)}
          className={`h-7 px-3 py-1 text-xs font-medium rounded-md border-zinc-800 bg-black/70 text-white hover:bg-black/90 transition-colors
            ${genreId === genre ? '!bg-black !text-white !border-purple-600 !ring-2 !ring-purple-700' : ''}
            ${glow[genre] || ''}
          `}
        >
          {genre
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </Button>
      ))}
    </div>
  );
}