import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  return (
  <header className="fixed w-full z-30 backdrop-blur-lg bg-gradient-to-b from-black/60 to-transparent border-none">
  <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <img src="../../public/shirayuki.png" alt="Shirayuki Logo" className="w-16 h-16 object-contain" />
          <span className="text-pink-400 font-bold text-3xl tracking-wide">SHIRAYUKI</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              placeholder="Enter your keywords to search..."
              className="w-full pl-10 pr-20 py-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <button className="absolute right-14 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-lg hover:bg-pink-500 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
          </div>
        </div>

        {/* Login Button */}
        <div className="flex items-center">
          <button className="bg-white text-black px-6 py-2 rounded-lg font-semibold shadow hover:bg-pink-500 hover:text-white transition">Login</button>
        </div>
      </div>
    </header>
  );
}
