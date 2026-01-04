import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategory } from "@/context/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { AnimeCard, AnimeCardSkeleton } from "@/components/category/AnimeCard";
import CategoryQuickLinks from "@/components/category/CategoryQuickLinks";
import CategoryHeader from "@/components/category/CategoryHeader";


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

  // You may want to move categories to a shared constants file if reused
  const categories = [
    { id: "tv", name: "TV Series", description: "Regular TV anime series" },
    { id: "movie", name: "Movies", description: "Anime feature films" },
    { id: "ova", name: "OVA", description: "Original Video Animation" },
    { id: "ona", name: "ONA", description: "Original Net Animation" },
    { id: "special", name: "Specials", description: "Special episodes and extras" },
    { id: "music", name: "Music", description: "Music videos and performances" },
  ];
  const currentCategory = categories.find((c) => c.id === categoryId);


  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Background Effects - Homepage style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(88, 28, 135, 0.1) 25%, rgba(0, 0, 0, 0.95) 50%, rgb(9, 9, 11) 100%)',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <CategoryHeader
          title={`${currentCategory?.name || categoryId.toUpperCase()} Anime`}
          description={currentCategory?.description || `Browse all ${categoryId} anime`}
        />

        {/* Category Quick Links */}
        <CategoryQuickLinks categoryId={categoryId} categoriesList={categories} />

        {/* Content Section */}
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
          {/* Results info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-400 text-sm sm:text-base">
              {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
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
              <div className="backdrop-blur-sm bg-white/5 border border-red-500/20 rounded-3xl p-8 sm:p-12 text-center">
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
              <div className="backdrop-blur-sm bg-white/5 border border-purple-500/20 rounded-3xl p-8 sm:p-12 text-center">
                <h2 className="text-2xl font-bold text-zinc-400 mb-4">No Anime Found</h2>
                <p className="text-zinc-500">
                  No anime found in the {currentCategory?.name || categoryId} category
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
                          className={`cursor-pointer text-white transition-all duration-300 ${currentPage === 1
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
                              className={`cursor-pointer transition-all duration-300 ${currentPage === item
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
                          className={`cursor-pointer text-white transition-all duration-300 ${!hasNextPage
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