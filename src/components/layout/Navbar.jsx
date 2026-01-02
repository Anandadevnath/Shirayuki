import { Home, Menu, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getSearchSuggestions } from "@/context/api";

const navLinks = [
  { name: "Home", href: "/", icon: <Home size={22} /> },
  { name: "Genres", href: "/genre" },
  { name: "Types", href: "/category" },
  { name: "Schedule", href: "/schedule" },
  { name: "A-Z List", href: "/az-list" },
  { name: "Studios", href: "/producer" },
];

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        const { data, error } = await getSearchSuggestions(searchQuery.trim());
        if (!error && data?.data?.suggestions) {
          setSuggestions(data.data.suggestions);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/anime/${suggestion.id}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${isScrolled
        ? "bg-black/80 backdrop-blur-xl border-white/10"
        : "bg-transparent border-transparent"
      }`}>
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex h-16 sm:h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/shirayuki2.png" alt="Shirayuki Logo" className="h-16 sm:h-14 lg:h-22 w-auto object-contain" />
            <img src="/text.png" alt="Shirayuki" className="h-16 sm:h-12 lg:h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="group text-sm font-medium text-white hover:text-white transition-colors uppercase tracking-wide"
              >
                <span className="relative inline-flex items-center gap-2">
                  {link.icon ? link.icon : null}
                  <span>{link.name}</span>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-blue-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                </span>
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop - Right aligned */}
          <div ref={searchRef} className="hidden md:flex items-center relative ml-auto">
            <form onSubmit={handleSearch} className="flex items-center">
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

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-3 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-sm shadow-2xl shadow-black/50 z-50 max-h-96 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
                }}
              >
                <style>{`
                  @keyframes suggestionSlideIn {
                    from {
                      opacity: 0;
                      transform: translateY(-8px) scale(0.98);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                    }
                  }
                  .suggestion-dropdown {
                    animation: suggestionSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                  .suggestions-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .suggestions-scroll::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 8px 0;
                  }
                  .suggestions-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5));
                    border-radius: 10px;
                  }
                  .suggestions-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(139, 92, 246, 0.7), rgba(236, 72, 153, 0.7));
                  }
                  .suggestion-item {
                    animation: suggestionItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                  }
                  @keyframes suggestionItemIn {
                    from {
                      opacity: 0;
                      transform: translateX(-8px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}</style>
                <div className="p-2 suggestions-scroll suggestion-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item w-full flex items-center gap-3 p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={suggestion.poster}
                          alt={suggestion.name}
                          className="w-12 h-16 object-cover rounded-lg ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {suggestion.name}
                        </p>
                        <p className="text-zinc-400 text-xs line-clamp-1 mt-0.5">
                          {suggestion.jname}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/30 text-purple-300 rounded-md"
                          >
                            {suggestion.type}
                          </Badge>
                          {suggestion.moreInfo?.[0] && (
                            <span className="text-zinc-500 text-xs">
                              {suggestion.moreInfo[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/10">
                  <Link
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setShowSuggestions(false)}
                    className="block w-full p-3 text-center text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    View all results →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Mobile Menu Button */}
          <div className="flex items-center ml-auto lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10 h-10 w-10">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-80 bg-zinc-950 border-zinc-800 px-4">
                <SheetHeader className="flex flex-row items-center justify-between pr-0">
                  <SheetTitle className="text-white flex items-center gap-0">
                    <img src="/shirayuki2.png" alt="Shirayuki Logo" className="h-12 w-auto object-contain" />
                    <img src="/text.png" alt="Shirayuki" className="h-10 w-auto object-contain" />
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <div className="mt-4 relative">
                  <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }}>
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
                        <Search size={18} />
                      </button>
                    </div>
                  </form>

                  {/* Mobile Search Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      className="mt-3 bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-xl shadow-xl max-h-[50vh] overflow-y-auto"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
                      }}
                    >
                      <div className="p-2 space-y-1">
                        {suggestions.slice(0, 6).map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => {
                              handleSuggestionClick(suggestion);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-purple-500/10 rounded-lg transition-all text-left group"
                          >
                            <img
                              src={suggestion.poster}
                              alt={suggestion.name}
                              className="w-11 h-15 object-cover rounded-lg ring-1 ring-white/10 group-hover:ring-purple-500/30 transition-all"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
                                {suggestion.name}
                              </p>
                              <p className="text-zinc-500 text-xs line-clamp-1 mt-0.5">
                                {suggestion.jname}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="text-[9px] px-1.5 py-0 bg-purple-500/20 border-0 text-purple-300">
                                  {suggestion.type}
                                </Badge>
                                <span className="text-zinc-600 text-[10px]">
                                  {suggestion.moreInfo?.[0]}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/5 p-1">
                        <Link
                          to={`/search?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            setShowSuggestions(false);
                            setIsMobileMenuOpen(false);
                          }}
                          className="block w-full py-2.5 text-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all text-sm font-medium"
                        >
                          View all results →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Nav Links */}
                <div className="mt-6 flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors uppercase tracking-wide font-medium group"
                    >
                      <span className="relative inline-block">
                        {link.name}
                        <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-pink-400 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                      </span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
