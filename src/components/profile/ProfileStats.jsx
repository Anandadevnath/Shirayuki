import React from "react";
import { Clock, Award } from "lucide-react";

export default function ProfileStats({ user }) {
  return (
    <div className="space-y-6">
      {/* Watch Stats */}
      <div className="relative animate-fade-in-up delay-100">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-fuchsia-500 opacity-50"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500 opacity-50"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500 opacity-50"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-fuchsia-500 opacity-50"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-fuchsia-500/30 rounded-lg p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-fuchsia-400" />
            Watch Activity
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-cyan-500/10 rounded-md p-4 text-center border border-cyan-500/20">
              <div className="text-3xl font-bold text-cyan-400 mb-1 font-mono">0</div>
              <div className="text-xs text-gray-400 font-mono uppercase">Episodes</div>
            </div>
            <div className="bg-fuchsia-500/10 rounded-md p-4 text-center border border-fuchsia-500/20">
              <div className="text-3xl font-bold text-fuchsia-400 mb-1 font-mono">0</div>
              <div className="text-xs text-gray-400 font-mono uppercase">Hours</div>
            </div>
            <div className="bg-purple-500/10 rounded-md p-4 text-center border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-400 mb-1 font-mono">0</div>
              <div className="text-xs text-gray-400 font-mono uppercase">Completed</div>
            </div>
            <div className="bg-indigo-500/10 rounded-md p-4 text-center border border-indigo-500/20">
              <div className="text-3xl font-bold text-indigo-400 mb-1 font-mono">0</div>
              <div className="text-xs text-gray-400 font-mono uppercase">Plan to Watch</div>
            </div>
          </div>
        </div>
      </div>
      {/* Account Info */}
      <div className="relative animate-fade-in-up delay-200">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Account Info
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-gray-400 font-mono text-xs uppercase">User ID</span>
              <span className="text-white font-mono text-sm">{user.id || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-gray-400 font-mono text-xs uppercase">Status</span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono uppercase border border-green-500/30">Active</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 font-mono text-xs uppercase">Member Since</span>
              <span className="text-white font-mono text-sm">Jan 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
