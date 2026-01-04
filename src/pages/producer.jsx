import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProducer } from "@/context/api";
import { AnimeCard, AnimeCardSkeleton } from "@/components/producer";
import StudioLogo from "@/components/producer/StudioLogo";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Building2, ChevronRight } from "lucide-react";

// Popular anime producers/studios
const popularProducers = [
  { id: "toei-animation", name: "Toei Animation" },
  { id: "madhouse", name: "Madhouse" },
  { id: "studio-ghibli", name: "Studio Ghibli" },
  { id: "bones", name: "Bones" },
  { id: "mappa", name: "MAPPA" },
  { id: "ufotable", name: "ufotable" },
  { id: "kyoto-animation", name: "Kyoto Animation" },
  { id: "wit-studio", name: "Wit Studio" },
  { id: "a-1-pictures", name: "A-1 Pictures" },
  { id: "sunrise", name: "Sunrise" },
  { id: "production-ig", name: "Production I.G" },
  { id: "cloverworks", name: "CloverWorks" },
  { id: "trigger", name: "Trigger" },
  { id: "shaft", name: "Shaft" },
  { id: "j-c-staff", name: "J.C.Staff" },
  { id: "pierrot", name: "Pierrot" },
];


export default function ProducerPage() {
  const { producerId } = useParams();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [producerName, setProducerName] = useState("");

  useEffect(() => {
    async function fetchAnimes() {
      if (!producerId) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await getProducer(producerId, currentPage);
      
      if (err) {
        setError(err);
      } else if (data?.data) {
        setAnimes(data.data.animes || []);
        setTotalPages(data.data.totalPages || 1);
        setHasNextPage(data.data.hasNextPage || false);
        setProducerName(data.data.producerName || producerId);
      }
      
      setLoading(false);
    }
    
    fetchAnimes();
  }, [producerId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [producerId]);

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

  const formatProducerName = (id) => {
    const found = popularProducers.find((p) => p.id === id);
    if (found) return found.name;
    return id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // If no producerId, show producer selection
  if (!producerId) {
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

        {/* Main Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="border-b border-white/5 backdrop-blur-md bg-gradient-to-b from-black/30 via-black/20 to-transparent">
            <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8 text-center">
              <h1 className="text-4xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Studios & Producers
              </h1>
              <p className="text-zinc-400">Browse anime by studio or producer</p>
            </div>
          </div>

          {/* Studios Grid */}
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">Popular Studios</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {popularProducers.map((producer) => (
                <Link key={producer.id} to={`/producer/${producer.id}`}>
                  <div className="group backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <StudioLogo id={producer.id} name={producer.name} size="w-10 h-10 sm:w-12 sm:h-12" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-semibold text-sm sm:text-base group-hover:text-purple-300 transition-colors block truncate">
                          {producer.name}
                        </span>
                        <span className="text-zinc-500 text-xs sm:text-sm">View Anime</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="border-b border-white/5 backdrop-blur-md bg-gradient-to-b from-black/30 via-black/20 to-transparent">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-8">
            {/* Studio Header */}
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center flex-shrink-0 mx-auto overflow-hidden">
                <StudioLogo id={producerId} name={producerName || formatProducerName(producerId)} size="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {producerName || formatProducerName(producerId)}
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base">
                  Browse all anime from this studio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="border-b border-white/10 backdrop-blur-sm bg-black/10">
          <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-4">
            <div className="flex flex-wrap gap-1 justify-center">
              {popularProducers.map((producer) => (
                <Link key={producer.id} to={`/producer/${producer.id}`}>
                  <button
                    className={`h-9 min-w-11 px-3 py-0.5 text-[13px] font-medium rounded-md border-zinc-800 bg-black/70 text-white hover:bg-black/90 transition-colors
                      ${producer.id === producerId ? '!bg-black !text-white !border-purple-600 !ring-2 !ring-purple-700' : ''}
                      hover:text-purple-400 hover:shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]
                      whitespace-nowrap
                    `}
                  >
                    {producer.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 py-8">
          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-400 text-sm sm:text-base">
              {totalPages > 1 && (
                <span>Page {currentPage} of {totalPages}</span>
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
                <Building2 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-zinc-400 mb-4">No Anime Found</h2>
                <p className="text-zinc-500">
                  No anime found from {formatProducerName(producerId)}
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