import React from "react";

export default function ProfileHeader({ user }) {
  return (
    <div className="relative mb-8 animate-fade-in-down">
      {/* Corner Decorations */}
      <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500 animate-border-glow"></div>
      <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500 animate-border-glow-delayed"></div>
      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500 animate-border-glow"></div>
      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500 animate-border-glow-delayed"></div>
      {/* Animated Border Effect */}
      <div className="absolute inset-0 border-scan-container overflow-hidden rounded-lg">
        <div className="border-scan"></div>
      </div>
      {/* Main header card */}
      <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-6 shadow-2xl shadow-cyan-500/10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group/avatar">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 rounded-full blur opacity-50 animate-gradient-rotate"></div>
            <div className="relative">
              <img
                src={user.avatar || "https://via.placeholder.com/150"}
                alt="Profile Avatar"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-cyan-500/50"
              />
            </div>
          </div>
          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:gap-4 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 mb-2 animate-gradient-text font-mono uppercase tracking-wider">
                {user.username}
              </h1>
              {user.tagline && (
                <span className="text-lg md:text-xl text-fuchsia-300 font-mono italic mt-1 md:mt-0">{user.tagline}</span>
              )}
            </div>
            <p className="text-gray-500 text-sm font-mono">{user.email}</p>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400 font-mono">0</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Watching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-fuchsia-400 font-mono">0</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 font-mono">0</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
