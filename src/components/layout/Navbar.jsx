import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getSearchSuggestions } from "@/context/api";

// Icons as simple SVG components
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const navLinks = [
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
  const searchRef = useRef(null);
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">❄️</span>
            <span className="text-xl font-bold text-white">Shirayuki</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wide"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden md:block relative">
            <form onSubmit={handleSearch} className="flex items-center">
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
                  className="w-72 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 pr-16"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <XIcon />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <SearchIcon />
                </button>
              </div>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <img
                      src={suggestion.poster}
                      alt={suggestion.name}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm line-clamp-1">
                        {suggestion.name}
                      </p>
                      <p className="text-zinc-500 text-xs line-clamp-1">
                        {suggestion.jname}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 border-zinc-600 text-zinc-400"
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
                <Link
                  to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setShowSuggestions(false)}
                  className="block w-full p-3 text-center text-purple-400 hover:bg-zinc-800 transition-colors text-sm font-medium border-t border-zinc-800"
                >
                  View all results →
                </Link>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <UserIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="text-zinc-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-800 cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-800 cursor-pointer">
                  Watchlist
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-800 cursor-pointer">
                  History
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-800 cursor-pointer">
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-zinc-950 border-zinc-800">
                <SheetHeader>
                  <SheetTitle className="text-white flex items-center gap-2">
                    <span className="text-xl">❄️</span> Shirayuki
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mt-6">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search anime..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <SearchIcon />
                    </button>
                  </div>
                </form>

                {/* Mobile Nav Links */}
                <div className="mt-6 flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors uppercase tracking-wide font-medium"
                    >
                      {link.name}
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
