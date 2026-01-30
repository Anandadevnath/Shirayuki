import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "@/context/api";
import { NavLinks } from "./navbar/NavLinks";
import { SearchBar } from "./navbar/SearchBar";
import { MobileMenu } from "./navbar/MobileMenu";
import "@/css/navbar.css";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      try {
        setUser(JSON.parse(localStorage.getItem("user")) || {});
      } catch {
        setUser({});
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  }, [searchQuery, navigate]);

  const handleSuggestionClick = useCallback((suggestion) => {
    navigate(`/anime/${suggestion.id}`);
    setSearchQuery("");
    setShowSuggestions(false);
  }, [navigate]);


  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${isScrolled
      ? "bg-black/80 backdrop-blur-xl border-white/10"
      : "bg-transparent border-transparent"
      }`}>
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex h-16 sm:h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/logo/shirayuki2.png" alt="Shirayuki Logo" className="h-16 sm:h-14 lg:h-22 w-auto object-contain" />
            <img src="/logo/text.png" alt="Shirayuki" className="h-16 sm:h-12 lg:h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Search Bar - Left side */}
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

          {/* Desktop Navigation - Centered */}
          <NavLinks />

          {/* Profile + Logout/Login - Desktop - Right side */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            {isLoggedIn ? (
              <>
                {/* Profile Avatar/Link */}
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/10 transition">
                  <img
                    src={user.pfpUrl || user.avatar || "/pfp/bleach/ichigo.png"}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                    style={{ background: '#222' }}
                  />
                  <span className="text-white text-sm font-medium hidden xl:inline">Profile</span>
                </Link>
                <button
                  className="group relative px-5 py-2 text-sm font-medium text-white border border-white/20 rounded-md hover:border-white/40 transition-all duration-300 uppercase tracking-wide overflow-hidden"
                  onClick={handleLogout}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                  <span className="absolute left-0 bottom-0 h-0.5 w-full bg-blue-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                </button>
              </>
            ) : (
              <button
                className="group relative px-5 py-2 text-sm font-medium text-white border border-white/20 rounded-md hover:border-white/40 transition-all duration-300 uppercase tracking-wide overflow-hidden"
                onClick={() => navigate('/login')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </span>
                <span className="absolute left-0 bottom-0 h-0.5 w-full bg-blue-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </button>
            )}
          </div>

          {/* Right Section - Mobile Menu Button */}
          <MobileMenu
            isOpen={isMobileMenuOpen}
            setIsOpen={setIsMobileMenuOpen}
            isLoggedIn={isLoggedIn}
            user={user}
            onLogout={handleLogout}
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