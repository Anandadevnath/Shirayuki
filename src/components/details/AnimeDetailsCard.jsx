import React from "react";

export default function AnimeDetailsCard({ anime }) {
  if (!anime) return null;
  const { info, moreInfo } = anime;
  return (
    <div className="flex flex-col md:flex-row bg-zinc-900/90 rounded-3xl p-6 md:p-10 gap-6 md:gap-10 shadow-lg border border-zinc-800">
      {/* Poster */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <img
          src={info.poster}
          alt={info.name}
          className="w-40 h-56 md:w-48 md:h-72 rounded-2xl object-cover shadow-md"
        />
      </div>
      {/* Details */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{info.name}</h1>
        <div className="text-zinc-400 text-sm mb-2 line-clamp-2">{info.synonyms?.join('; ')}</div>
        <div className="flex items-center gap-2 mb-2">
          {info.stats?.is_cc && (
            <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded font-semibold">CC {info.stats.is_cc}</span>
          )}
          <span className="bg-zinc-800 text-zinc-200 text-xs px-2 py-0.5 rounded font-semibold">{info.stats?.type || 'TV'}</span>
        </div>
        <div className="text-zinc-200 text-base mb-3 line-clamp-3">{info.description}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-zinc-400">Country:</span> <span className="text-white">{moreInfo?.country || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Status:</span> <span className="text-white">{moreInfo?.status || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Genres:</span> <span className="text-white">{moreInfo?.genres?.join(', ') || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Scores:</span> <span className="text-white">{info.stats?.score || '?'} by {info.stats?.scoreCount || '?'} reviews</span>
          </div>
          <div>
            <span className="text-zinc-400">Premiered:</span> <span className="text-white">{moreInfo?.premiered || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Studios:</span> <span className="text-white">{moreInfo?.studios || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Date aired:</span> <span className="text-white">{moreInfo?.aired || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Producers:</span> <span className="text-white">{moreInfo?.producers?.join(', ') || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Broadcast:</span> <span className="text-white">{moreInfo?.broadcast || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Links:</span> <span className="text-blue-400">{moreInfo?.externalLinks?.join(', ') || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Episodes:</span> <span className="text-white">{info.stats?.episodes?.eps || '?'}</span>
          </div>
          <div>
            <span className="text-zinc-400">Duration:</span> <span className="text-white">{moreInfo?.duration || '?'}</span>
          </div>
        </div>
      </div>
      {/* Rating */}
      <div className="flex flex-col items-center justify-center bg-zinc-800/60 rounded-2xl p-6 min-w-[260px] max-w-xs self-center">
        <div className="text-orange-400 text-lg font-semibold mb-1">How’d you rate this anime?</div>
        <div className="text-2xl font-bold text-white mb-1">{info.stats?.score || '?'}</div>
        <div className="text-zinc-400 text-xs mb-2">by {info.stats?.scoreCount || '?'} reviews</div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`text-3xl ${i <= Math.round((info.stats?.score || 0)/2) ? 'text-orange-400' : 'text-zinc-600'}`}>★</span>
          ))}
        </div>
      </div>
    </div>
  );
}
