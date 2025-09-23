import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  return (
    <header className="backdrop-blur-sm bg-black/40 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">HA</div>
          <div>
            <div className="text-white font-semibold">Hi-Anime</div>
            <div className="text-xs text-gray-300">Stream with style</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className={`px-3 py-2 rounded text-sm ${loc.pathname === '/' ? 'bg-pink-500 text-white' : 'text-gray-200 hover:bg-white/5'}`}>Home</Link>
          <Link to="#" className="px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/5">Trending</Link>
          <Link to="#" className="px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/5">Favorites</Link>
          <Link to="#" className="px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/5">About</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden md:inline-block bg-white/10 text-white px-3 py-1 rounded">Sign in</button>
          <button className="p-2 rounded bg-white/5 hover:bg-white/10">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
