import React from "react";
import { Link } from "react-router-dom";
import { Search, Menu } from "lucide-react";
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
import { MobileSearchSuggestions } from "./SearchSuggestions";
import { NAV_LINKS } from "../navLinksData";

export function MobileMenu({
  isOpen,
  setIsOpen,
  isLoggedIn,
  user,
  onLogout,
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  onSearch,
  onSuggestionClick,
}) {
  return (
    <div className="flex items-center ml-auto lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10 h-10 w-10">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[340px] bg-zinc-950/95 backdrop-blur-xl border-0 px-0 overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="flex flex-row items-center justify-between px-5 pt-2 pb-4 border-b border-white/5">
              <SheetTitle className="text-white flex items-center gap-0">
                <img src="/logo/shirayuki2.png" alt="Shirayuki Logo" className="h-12 w-auto object-contain" />
                <img src="/logo/text.png" alt="Shirayuki" className="h-10 w-auto object-contain" />
              </SheetTitle>
            </SheetHeader>

            {/* User Profile Section */}
            <div className="px-5 py-4 border-b border-white/5">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <img
                        src={user.pfpUrl || user.avatar || "/logo/shirayuki2.png"}
                        alt="Profile"
                        className="relative w-12 h-12 rounded-full object-cover border-2 border-white/20 group-hover:border-cyan-400/50 transition-all"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate group-hover:text-cyan-400 transition-colors">
                        {user.username || "User"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">View Profile →</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/40 hover:from-red-500/20 hover:to-orange-500/20 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-semibold uppercase tracking-wider">Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full"
                >
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Search */}
            <div className="px-5 pt-4 relative">
              <form onSubmit={(e) => { onSearch(e); setIsOpen(false); }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 rounded-xl blur-sm opacity-0 focus-within:opacity-100 transition-opacity"></div>
                  <Input
                    type="text"
                    placeholder="Search anime..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="relative w-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 pl-4 pr-10 rounded-xl h-11 focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-cyan-400 transition-colors"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>

              {/* Mobile Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <MobileSearchSuggestions
                  suggestions={suggestions}
                  searchQuery={searchQuery}
                  onSuggestionClick={(s) => {
                    onSuggestionClick(s);
                    setIsOpen(false);
                  }}
                  onClose={() => {
                    setShowSuggestions(false);
                    setIsOpen(false);
                  }}
                />
              )}
            </div>

            {/* Mobile Nav Links - Premium Design */}
            <div className="flex-1 overflow-y-auto px-3 mt-4 custom-scrollbar">
              {/* Section Label */}
              <div className="px-3 mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                <span className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-mono">Navigation</span>
                <div className="h-px flex-1 bg-gradient-to-l from-fuchsia-500/50 to-transparent"></div>
              </div>

              <div className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link, index) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Glow Effect on Hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-fuchsia-500/10 blur-sm"></div>

                    {/* Icon Container */}
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 bg-white/5 group-hover:bg-gradient-to-br group-hover:from-cyan-500/30 group-hover:to-fuchsia-500/30">
                      {link.icon ? (
                        <span className="text-zinc-400 group-hover:text-white transition-colors">{React.createElement(link.icon, { size: 18, className: 'h-4 w-4' })}</span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500/50 to-fuchsia-500/50"></span>
                      )}
                    </div>

                    {/* Link Text */}
                    <span className="relative text-sm font-semibold uppercase tracking-wider transition-all duration-300 text-zinc-400 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-fuchsia-400">
                      {link.name}
                    </span>

                    {/* Hover Arrow */}
                    <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Gradient Line */}
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
