import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getGenre } from "@/context/api";
import GenreFilter from "@/components/genre/GenreFilter";
import { AnimeCard, AnimeCardSkeleton } from "@/components/genre";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";


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
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Background Effects - Homepage style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Radial gradient from center */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(88, 28, 135, 0.1) 25%, rgba(0, 0, 0, 0.95) 50%, rgb(9, 9, 11) 100%)'
          }}
        ></div>
      </div>

      {/* Main Content - Relative positioning for layering */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="border-b border-white/5 backdrop-blur-md bg-gradient-to-b from-black/30 via-black/20 to-transparent">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {formatGenreName(genreId)} Anime
            </h1>
            <p className="text-zinc-400">Browse all anime in the {formatGenreName(genreId)} genre</p>
          </div>
        </div>

        {/* Genre Filter Section */}
        <div className="border-b border-white/5 backdrop-blur-md bg-black/15">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-4">
            <GenreFilter genreId={genreId} />
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
          {/* Page Info */}
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
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="glass-container-dark rounded-3xl p-8 sm:p-12 text-center border border-red-500/20">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Anime</h2>
                <p className="text-zinc-400 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && animes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="glass-container-dark rounded-3xl p-8 sm:p-12 text-center border border-purple-500/20">
                <h2 className="text-2xl font-bold text-zinc-400 mb-4">No Anime Found</h2>
                <p className="text-zinc-500">
                  No anime found in the {formatGenreName(genreId)} genre
                </p>
              </div>
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
                          className={`cursor-pointer text-white transition-all duration-300 ${
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "hover:bg-white/10 hover:scale-105"
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
                              className={`cursor-pointer transition-all duration-300 ${
                                currentPage === item
                                  ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white hover:scale-105 shadow-xl shadow-purple-500/60"
                                  : "text-white hover:bg-white/10 hover:scale-105"
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
                          className={`cursor-pointer text-white transition-all duration-300 ${
                            !hasNextPage
                              ? "pointer-events-none opacity-50"
                              : "hover:bg-white/10 hover:scale-105"
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
    </div>
  );
}