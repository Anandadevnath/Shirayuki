import { forwardRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "./SearchSuggestions";

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
    <div ref={ref} className="hidden md:flex items-center relative ml-6">
      <form onSubmit={onSearch} className="flex items-center">
        <div className="relative flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">
            <Search size={18} />
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
