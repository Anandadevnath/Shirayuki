import React, { useState, useRef, useEffect } from 'react';
import { useShirayukiAPI } from '../context';
import { useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  const { getSearchSuggestions, searchAnime } = useShirayukiAPI();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceTimeout = useRef();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setError("");
    setActiveIndex(-1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (value.length > 1) {
      setLoading(true);
      debounceTimeout.current = setTimeout(async () => {
        try {
          const data = await getSearchSuggestions(value);
          console.log('Suggestion API response:', data);
          let suggestionsArr = [];
          if (Array.isArray(data)) {
            suggestionsArr = data;
          } else if (data && Array.isArray(data.suggestions)) {
            suggestionsArr = data.suggestions;
          } else if (data && data.data && Array.isArray(data.data.suggestions)) {
            suggestionsArr = data.data.suggestions;
          }
          setSuggestions(suggestionsArr);
          setError("");
        } catch (err) {
          console.error('Suggestion API error:', err);
          setError("Network or CORS error. See console for details.");
          setSuggestions([]);
        }
        setLoading(false);
      }, 350);
    } else {
      setSuggestions([]);
      setError("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      setQuery(suggestions[activeIndex].name);
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  return (
    <header className="fixed w-full z-30 backdrop-blur-lg bg-gradient-to-b from-black/60 to-transparent border-none">
      <div className="max-w-7xl mx-16 px-4 py-2 flex items-cente ">
        {/* Logo, Title, and Search Bar in a row */}
        <div className="flex items-center w-full" style={{ gap: '2.5rem' }}>
          <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: '15rem' }}>
            <img src="../../public/shirayuki.png" alt="Shirayuki Logo" className="w-16 h-16 object-contain" />
            <span className="text-white font-bold text-3xl tracking-wide">𝚂𝚑𝚒𝚛𝚊𝚢𝚞𝚔𝚒</span>
          </div>
          <form className="relative flex-1 max-w-2xl ml-8" onSubmit={e => e.preventDefault()} ref={inputRef}>
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your keywords to search..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
              autoComplete="off"
              onFocus={() => query.length > 1 && setShowSuggestions(true)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            {showSuggestions && (
              <ul className="absolute left-0 top-full mt-1 w-full rounded-lg shadow-lg z-20 backdrop-blur-md bg-gradient-to-b from-black/10 via-black/20 to-pink-400/80 border border-pink-400/30">
                {loading ? (
                  <li className="px-3 py-2 text-gray-400 flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-pink-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading suggestions...
                  </li>
                ) : error ? (
                  <li className="px-3 py-2 text-red-400 font-bold">{error}</li>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <li
                      key={s.id || s.name || idx}
                      onClick={() => handleSuggestionClick(s)}
                      className={`px-3 py-2 cursor-pointer text-white hover:bg-pink-400/30 ${activeIndex === idx ? 'bg-pink-400/80' : ''}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      {s.name}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-yellow-600 font-bold">No suggestions found.</li>
                )}
              </ul>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}
