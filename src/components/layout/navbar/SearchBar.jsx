import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "./Icons";
import { SearchSuggestions, MobileSearchSuggestions } from "./SearchSuggestions";

// Desktop Search Bar
export const SearchBar = forwardRef(function SearchBar({
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  onSearch,
  onSuggestionClick,
}, ref) {
  return (
    <div ref={ref} className="hidden md:flex items-center relative ml-auto">
      <form onSubmit={onSearch} className="flex items-center">
        <div className="relative flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">
            <SearchIcon />
          </span>
          <Input
            type="text"
            placeholder="Enter your keywords to search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-90 h-10 bg-transparent border-white text-white placeholder:text-white focus:border-zinc-500 pl-10 pr-4 rounded-ml"
          />
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <SearchSuggestions
          suggestions={suggestions}
          searchQuery={searchQuery}
          onSuggestionClick={onSuggestionClick}
          onClose={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
});

// Mobile Search Bar
export function MobileSearchBar({
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  onSearch,
  onSuggestionClick,
  onMenuClose,
}) {
  const handleSearch = (e) => {
    onSearch(e);
    onMenuClose();
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    onMenuClose();
  };

  return (
    <div className="mt-4 relative">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search anime..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 pl-4 pr-10 rounded-xl h-11"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <MobileSearchSuggestions
          suggestions={suggestions}
          searchQuery={searchQuery}
          onSuggestionClick={handleSuggestionClick}
          onClose={() => {
            setShowSuggestions(false);
            onMenuClose();
          }}
        />
      )}
    </div>
  );
}
