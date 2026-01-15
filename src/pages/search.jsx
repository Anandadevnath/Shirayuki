import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchAnime, getSearchSuggestions } from "@/context/api";
// Removed unused Card, CardContent imports
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, X } from "lucide-react";

function AnimeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[2/3]">
      <Skeleton className="w-full h-full bg-zinc-800" />
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
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3 sm:h-3">
                  <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
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

function SuggestionItem({ suggestion, onClick }) {
  return (
    <button
      onClick={() => onClick(suggestion)}
      className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors text-left"
    >
      <img
        src={suggestion.poster}
        alt={suggestion.name}
        className="w-12 h-16 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm line-clamp-1">{suggestion.name}</p>
        <p className="text-zinc-500 text-xs line-clamp-1">{suggestion.jname}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0 border-zinc-600 text-zinc-400">
            {suggestion.type}
          </Badge>
          {suggestion.moreInfo?.[0] && (
            <span className="text-zinc-500 text-xs">{suggestion.moreInfo[0]}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(query);
  const [animes, setAnimes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.trim().length >= 2) {
        setSuggestionsLoading(true);
        const { data, error } = await getSearchSuggestions(searchInput.trim());
        if (!error && data?.data?.suggestions) {
          setSuggestions(data.data.suggestions);
        }
        setSuggestionsLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch search results
  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setAnimes([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: err } = await searchAnime(query, page);

      if (err) {
        setError(err);
      } else if (data?.data) {
        setAnimes(data.data.animes || []);
        setTotalPages(data.data.totalPages || 1);
        setHasNextPage(data.data.hasNextPage || false);
      }

      setLoading(false);
    }

    fetchResults();
  }, [query, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim(), page: "1" });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.name);
    setSearchParams({ q: suggestion.name, page: "1" });
    setShowSuggestions(false);
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSuggestions([]);
    setSearchParams({});
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      } else if (page >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = page - 1; i <= page + 1; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header with Search */}
      <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Search Anime</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl flex flex-col items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search for anime..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-12 pr-24 h-14 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 w-full"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700"
              >
                Search
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                  />
                ))}
              </div>
            )}
          </form>

          {/* Click outside to close suggestions */}
          {showSuggestions && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSuggestions(false)}
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Results info */}
        {query && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-400">
              Search results for{" "}
              <span className="text-purple-400 font-semibold">"{query}"</span>
              {totalPages > 1 && (
                <span className="ml-2">
                  - Page {page} of {totalPages}
                </span>
              )}
            </p>
          </div>
        )}

        {/* No Query State */}
        {!query && !loading && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-zinc-400 mb-2">
              Start Searching
            </h2>
            <p className="text-zinc-500">
              Enter an anime title to search our database
            </p>
          </div>
        )}

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
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Error Searching
            </h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty Results */}
        {!loading && !error && query && animes.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-zinc-400 mb-4">
              No Results Found
            </h2>
            <p className="text-zinc-500">
              No anime found matching "{query}". Try a different search term.
            </p>
          </div>
        )}

        {/* Results Grid */}
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
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        className={`cursor-pointer ${
                          page === 1
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
                            isActive={page === item}
                            className={`cursor-pointer ${
                              page === item
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
                        onClick={() =>
                          handlePageChange(Math.min(totalPages, page + 1))
                        }
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
