import { Link } from "react-router-dom";

const categories = [
  { id: "tv", name: "TV Series" },
  { id: "movie", name: "Movies" },
  { id: "ova", name: "OVA" },
  { id: "ona", name: "ONA" },
  { id: "special", name: "Specials" },
  { id: "music", name: "Music" },
];

export default function CategoryQuickLinks({ categoryId, categoriesList = categories }) {
  return (
    <div className="border-b border-white/5 backdrop-blur-md bg-black/15">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {categoriesList.map((category) => (
            <Link key={category.id} to={`/category/${category.id}`}>
              <button
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                  category.id === categoryId
                    ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105"
                    : "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-purple-400/30 hover:scale-105"
                }`}
              >
                {category.name}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
