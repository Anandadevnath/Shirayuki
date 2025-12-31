import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategory } from "@/context/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Play, Captions, Mic, ChevronRight, Tv, Film, Clapperboard, Music2, Star } from "lucide-react";

const categories = [
  { id: "tv", name: "TV Series", icon: Tv, description: "Regular TV anime series" },
  { id: "movie", name: "Movies", icon: Film, description: "Anime feature films" },
  { id: "ova", name: "OVA", icon: Clapperboard, description: "Original Video Animation" },
  { id: "ona", name: "ONA", icon: Play, description: "Original Net Animation" },
  { id: "special", name: "Specials", icon: Star, description: "Special episodes and extras" },
  { id: "music", name: "Music", icon: Music2, description: "Music videos and performances" },
];

function AnimeCardSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full bg-zinc-800" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-full mb-2 bg-zinc-800" />
        <Skeleton className="h-3 w-2/3 bg-zinc-800" />
      </CardContent>
    </Card>
  );
}

function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`}>
      <Card className="group bg-zinc-900 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all duration-300 cursor-pointer">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={anime.poster}
            alt={anime.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          
          {anime.rating && (
            <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
              {anime.rating}
            </Badge>
          )}
          
          <Badge className="absolute top-2 right-2 bg-purple-600 text-white text-xs">
            {anime.type}
          </Badge>
          
          {anime.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {anime.duration}
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 flex gap-1">
            {anime.episodes?.sub && (
              <div className="flex items-center gap-1 bg-purple-600/90 text-white text-xs px-2 py-1 rounded">
                <Captions className="h-3 w-3" />
                {anime.episodes.sub}
              </div>
            )}
            {anime.episodes?.dub && (
              <div className="flex items-center gap-1 bg-blue-600/90 text-white text-xs px-2 py-1 rounded">
                <Mic className="h-3 w-3" />
                {anime.episodes.dub}
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
            {anime.name}
          </h3>
          {anime.jname && anime.jname !== anime.name && (
            <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{anime.jname}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    async function fetchAnimes() {
      if (!categoryId) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await getCategory(categoryId, currentPage);
      
      if (err) {
        setError(err);
      } else if (data?.data) {
        setAnimes(data.data.animes || []);
        setTotalPages(data.data.totalPages || 1);
        setHasNextPage(data.data.hasNextPage || false);
      }
      
      setLoading(false);
    }
    
    fetchAnimes();
  }, [categoryId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      }
    }
    
    return items;
  };

  const currentCategory = categories.find((c) => c.id === categoryId);

  // If no categoryId, show category selection
  if (!categoryId) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Browse by Type</h1>
            <p className="text-zinc-400">Select a type to explore anime</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} to={`/category/${category.id}`}>
                  <Card className="group bg-zinc-900 border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 transition-all cursor-pointer h-full">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                        <Icon className="h-7 w-7 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-zinc-500 text-sm">{category.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Link to="/category" className="hover:text-white transition-colors">Types</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-purple-400">{currentCategory?.name || categoryId.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentCategory?.name || categoryId.toUpperCase()} Anime
          </h1>
          <p className="text-zinc-400">
            {currentCategory?.description || `Browse all ${categoryId} anime`}
          </p>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.id}`}>
                <Badge
                  variant={category.id === categoryId ? "default" : "outline"}
                  className={`cursor-pointer ${
                    category.id === categoryId
                      ? "bg-purple-600 text-white"
                      : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-zinc-400">
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Anime</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && animes.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-zinc-400 mb-4">No Anime Found</h2>
            <p className="text-zinc-500">
              No anime found in the {currentCategory?.name || categoryId} category
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && animes.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {animes.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={`cursor-pointer ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-zinc-800"
                        }`}
                      />
                    </PaginationItem>
                    
                    {getPaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {item === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(item)}
                            isActive={currentPage === item}
                            className={`cursor-pointer ${
                              currentPage === item
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "hover:bg-zinc-800"
                            }`}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={`cursor-pointer ${
                          !hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-zinc-800"
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
