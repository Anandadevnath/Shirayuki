import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProducer } from "@/context/api";
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
import { Play, Captions, Mic, ChevronRight, Building2 } from "lucide-react";

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
      <div className="min-h-screen bg-zinc-950">
        <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Studios & Producers</h1>
            <p className="text-zinc-400">Browse anime by studio or producer</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold text-white mb-4">Popular Studios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {popularProducers.map((producer) => (
              <Link key={producer.id} to={`/producer/${producer.id}`}>
                <Card className="group bg-zinc-900 border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <Building2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-white font-medium group-hover:text-purple-400 transition-colors flex-1">
                      {producer.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
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
            <Link to="/producer" className="hover:text-white transition-colors">Studios</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-purple-400">{formatProducerName(producerId)}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {producerName || formatProducerName(producerId)}
              </h1>
              <p className="text-zinc-400">
                Browse all anime from this studio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {popularProducers.slice(0, 8).map((producer) => (
              <Link key={producer.id} to={`/producer/${producer.id}`}>
                <Badge
                  variant={producer.id === producerId ? "default" : "outline"}
                  className={`cursor-pointer ${
                    producer.id === producerId
                      ? "bg-purple-600 text-white"
                      : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {producer.name}
                </Badge>
              </Link>
            ))}
            <Link to="/producer">
              <Badge
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                View All →
              </Badge>
            </Link>
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
              No anime found from {formatProducerName(producerId)}
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
