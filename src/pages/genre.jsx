import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getGenre } from "@/context/api";
import { Badge } from "@/components/ui/badge";
import GenreFilter from "@/components/genre/GenreFilter";
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


function AnimeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[2/3] bg-zinc-900 border border-zinc-800 animate-pulse">
      <div className="w-full h-full flex flex-col">
        <div className="flex-1">
          <Skeleton className="w-full h-full bg-zinc-800" />
        </div>
        <div className="p-2 sm:p-3">
          <Skeleton className="h-4 w-3/4 mb-2 bg-zinc-800 rounded" />
          <Skeleton className="h-3 w-1/2 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
}

function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[2/3]">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {/* Type Badge */}
        {anime.type && (
          <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-purple-600 hover:bg-purple-700 text-[10px] sm:text-xs">
            {anime.type}
          </Badge>
        )}
        {/* Rating Badge */}
        {anime.rating && (
          <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-600 hover:bg-red-700 text-[10px] sm:text-xs">
            {anime.rating}
          </Badge>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors">
            {anime.name}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {anime.episodes?.sub && (
              <Badge className="bg-pink-500/90 hover:bg-pink-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3 sm:h-3"><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                {anime.episodes.sub}
              </Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-green-600/90 hover:bg-green-600 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                🎙️ {anime.episodes.dub}
              </Badge>
            )}
            {anime.duration && (
              <span className="text-zinc-400 text-[10px] sm:text-xs ml-auto">{anime.duration}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GenrePage() {
  const { genreId } = useParams();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [genreName, setGenreName] = useState("");

  useEffect(() => {
    async function fetchAnimes() {
      if (!genreId) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await getGenre(genreId, currentPage);
      
      if (err) {
        setError(err);
      } else if (data?.data) {
        setAnimes(data.data.animes || []);
        setTotalPages(data.data.totalPages || 1);
        setHasNextPage(data.data.hasNextPage || false);
        setGenreName(data.data.genreName || genreId);
      }
      
      setLoading(false);
    }
    
    fetchAnimes();
  }, [genreId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [genreId]);

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

  const formatGenreName = (genre) => {
    return genre
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!genreId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">{formatGenreName(genreId)} Anime</h1>
          <p className="text-zinc-400">Browse all anime in the {formatGenreName(genreId)} genre</p>
        </div>
      </div>

      {/* Genre Filter (small outlined buttons) */}
      <div className="bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-4">
          <GenreFilter genreId={genreId} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-zinc-400">
            <span className="text-purple-400 font-semibold">
              {formatGenreName(genreId)}
            </span>
            {totalPages > 1 && (
              <span className="ml-2">
                - Page {currentPage} of {totalPages}
              </span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Anime</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && animes.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-zinc-400 mb-4">No Anime Found</h2>
            <p className="text-zinc-500">
              No anime found in the {formatGenreName(genreId)} genre
            </p>
          </div>
        )}

        {/* Anime Grid */}
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
                        className={`cursor-pointer text-white ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-white"
                        }`}
                      />
                    </PaginationItem>
                    {getPaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {item === "ellipsis" ? (
                          <PaginationEllipsis className="text-white" />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(item)}
                            isActive={currentPage === item}
                            className={`cursor-pointer ${
                              currentPage === item
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "text-white hover:bg-white"
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
                        className={`cursor-pointer text-white ${
                          !hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-white"
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