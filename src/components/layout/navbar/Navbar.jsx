import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "@/context/api";
import { NavLinks } from "./NavLinks";
import { SearchBar } from "./SearchBar";
import { MobileMenu } from "./MobileMenu";

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
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
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

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
      isScrolled 
        ? "bg-black/80 backdrop-blur-xl border-white/10" 
        : "bg-transparent border-transparent"
    }`}>
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex h-16 sm:h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/shirayuki2.png" 
              alt="Shirayuki Logo" 
              className="h-16 sm:h-14 lg:h-22 w-auto object-contain" 
            />
            <img 
              src="/text.png" 
              alt="Shirayuki" 
              className="h-16 sm:h-12 lg:h-20 w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <NavLinks />

          {/* Desktop Search Bar */}
          <SearchBar
            ref={searchRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            onSearch={handleSearch}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* Mobile Menu */}
          <MobileMenu
            isOpen={isMobileMenuOpen}
            setIsOpen={setIsMobileMenuOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            onSearch={handleSearch}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>
    </nav>
  );
}
