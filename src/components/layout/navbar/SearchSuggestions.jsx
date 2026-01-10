import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Single suggestion item component
export function SuggestionItem({ suggestion, onClick, index = 0, variant = "desktop" }) {
  const isDesktop = variant === "desktop";

  return (
    <button
      onClick={onClick}
      className={`
        ${isDesktop ? "suggestion-item" : ""} 
        w-full flex items-center gap-3 p-2.5 
        hover:bg-${isDesktop ? "white/10" : "purple-500/10"} 
        rounded-${isDesktop ? "xl" : "lg"} 
        transition-all duration-200 text-left group
      `}
      style={isDesktop ? { animationDelay: `${index * 50}ms` } : undefined}
    >
      <div className="relative flex-shrink-0">
        <img
          src={suggestion.poster}
          alt={suggestion.name}
          className={`
            ${isDesktop ? "w-12 h-16" : "w-11 h-15"} 
            object-cover rounded-lg ring-1 ring-white/10 
            group-hover:ring-purple-500/${isDesktop ? "50" : "30"} 
            transition-all
          `}
        />
        {isDesktop && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
          {suggestion.name}
        </p>
        <p className={`${isDesktop ? "text-zinc-400" : "text-zinc-500"} text-xs line-clamp-1 mt-0.5`}>
          {suggestion.jname}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={isDesktop ? "outline" : undefined}
            className={`
              text-[${isDesktop ? "10px" : "9px"}] px-1.5 py-${isDesktop ? "0.5" : "0"} 
              bg-purple-500/20 ${isDesktop ? "border-purple-500/30" : "border-0"} 
              text-purple-300 ${isDesktop ? "rounded-md" : ""}
            `}
          >
            {suggestion.type}
          </Badge>
          {suggestion.moreInfo?.[0] && (
            <span className={`text-zinc-${isDesktop ? "500" : "600"} text-${isDesktop ? "xs" : "[10px]"}`}>
              {suggestion.moreInfo[0]}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// Desktop search suggestions dropdown
export function SearchSuggestions({
  suggestions,
  searchQuery,
  onSuggestionClick,
  onClose
}) {
  if (!suggestions.length) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-3 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 max-h-96 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
      }}
    >
      <div className="p-2 suggestions-scroll suggestion-dropdown">
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            index={index}
            variant="desktop"
          />
        ))}
      </div>
      <div className="border-t border-white/10">
        <Link
          to={`/search?q=${encodeURIComponent(searchQuery)}`}
          onClick={onClose}
          className="block w-full p-3 text-center text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-all text-sm font-medium"
        >
          View all results →
        </Link>
      </div>
    </div>
  );
}

// Mobile search suggestions
export function MobileSearchSuggestions({
  suggestions,
  searchQuery,
  onSuggestionClick,
  onClose
}) {
  if (!suggestions.length) return null;

  return (
    <div
      className="mt-3 bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-xl shadow-xl max-h-[50vh] overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
      }}
    >
      <div className="p-2 space-y-1">
        {suggestions.slice(0, 6).map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            variant="mobile"
          />
        ))}
      </div>
      <div className="border-t border-white/5 p-1">
        <Link
          to={`/search?q=${encodeURIComponent(searchQuery)}`}
          onClick={onClose}
          className="block w-full py-2.5 text-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all text-sm font-medium"
        >
          View all results →
        </Link>
      </div>
    </div>
  );
}
