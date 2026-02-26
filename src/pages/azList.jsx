import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAZList } from "@/context/api";
import { Button } from "@/components/ui/button";
import { AnimeCard, AnimeCardSkeleton } from "@/components/az";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const alphabet = ["All", "0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];


export default function AZList() {
  const { letter = "all" } = useParams();
  const navigate = useNavigate();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    async function fetchAnimes() {
      setLoading(true);
      setError(null);

      const letterParam = letter === "all" ? "all" : letter;
      const { data, error: err } = await getAZList(letterParam, currentPage);

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
  }, [letter, currentPage]);

  useEffect(() => {
    const t = setTimeout(() => setCurrentPage(1), 0);
    return () => clearTimeout(t);
  }, [letter]);

  const handleLetterClick = (newLetter) => {
    navigate(`/az-list/${newLetter.toLowerCase()}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate pagination items
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
        <div className="border-b border-white/10 backdrop-blur-sm bg-black/20">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              A-Z List
            </h1>
            <p className="text-zinc-400">Browse anime alphabetically from A to Z</p>
          </div>
        </div>

        {/* Alphabet Filter Section */}
        <div className="border-b border-white/10 backdrop-blur-sm bg-black/10">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-4">
              <div className="flex flex-wrap gap-1 justify-center">
                {alphabet.map((char) => (
                  <Button
                    key={char}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLetterClick(char)}
                    className={`h-9 min-w-11 px-2 py-0.5 text-[12px] font-medium rounded-md border-zinc-800 bg-black/70 text-white hover:bg-black/90 transition-colors
                      ${letter.toLowerCase() === char.toLowerCase() ? '!bg-black !text-white !border-purple-600 !ring-2 !ring-purple-700' : ''}
                      hover:text-purple-400 hover:shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]
                      whitespace-nowrap
                    `}
                  >
                    {char}
                  </Button>
                ))}
              </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
          {/* Results info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-400">
              Showing anime starting with{" "}
              <span className="text-purple-400 font-semibold">
                "{letter.toUpperCase()}"
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
                No anime found starting with "{letter.toUpperCase()}"
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
                          className={`cursor-pointer text-white ${currentPage === 1
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
                              className={`cursor-pointer ${currentPage === item
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
                          className={`cursor-pointer text-white ${!hasNextPage
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
    </div>
  );
}