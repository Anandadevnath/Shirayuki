import React from "react";

export default function AnimeDetailsCard({ anime }) {
  if (!anime) return null;
  const { info, moreInfo } = anime;

  // Merge genres from both info and moreInfo, deduplicate
  const genres = Array.from(new Set([
    ...(moreInfo?.genres || []),
    ...(info?.genres || [])
  ]));

  // Use malscore as fallback for score
  const score = info.stats?.score || moreInfo?.malscore || '?';
  const scoreCount = info.stats?.scoreCount || '?';

  // Show both sub/dub episode counts if available
  let episodes = '?';
  if (info.stats?.episodes) {
    const sub = info.stats.episodes.sub;
    const dub = info.stats.episodes.dub;
    if (sub && dub) {
      episodes = `${sub} sub, ${dub} dub`;
    } else if (sub) {
      episodes = `${sub} sub`;
    } else if (dub) {
      episodes = `${dub} dub`;
    }
  }

  // Studios: support string or array
  let studios = moreInfo?.studios;
  if (Array.isArray(studios)) {
    studios = studios.join(', ');
  }

  // Producers: always array
  let producers = moreInfo?.producers?.join(', ') || '?';

  return (
    <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-8">
        {/* Poster */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <img
            src={info.poster}
            alt={info.name}
            className="w-48 h-72 md:w-56 md:h-80 rounded-2xl object-cover shadow-xl ring-2 ring-white/10"
          />
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {info.name}
          </h1>

          {/* Synonyms */}
          {info.synonyms && info.synonyms.length > 0 && (
            <div className="text-purple-300 text-sm mb-2 line-clamp-2">
              {info.synonyms.join(' • ')}
            </div>
          )}

          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            {info.stats?.is_cc && (
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                CC {info.stats.is_cc}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="text-zinc-200 text-base leading-relaxed mb-4 line-clamp-4">
            {info.description}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <InfoRow label="Status" value={moreInfo?.status || '?'} />
            <InfoRow label="Genres" value={genres.length > 0 ? genres.join(', ') : '?'} />
            <InfoRow 
              label="Scores" 
              value={`${score}`} 
            />
            <InfoRow label="Type" value={info.stats?.type || info.type || '?'} />
            <InfoRow label="Premiered" value={moreInfo?.premiered || '?'} />
            <InfoRow label="Studios" value={studios || '?'} />
            <InfoRow label="Date aired" value={moreInfo?.aired || '?'} />
            <InfoRow label="Producers" value={producers} />
            <InfoRow label="Episodes" value={episodes} />
            <InfoRow label="Duration" value={moreInfo?.duration || '?'} />
          </div>
        </div>

        {/* Rating Card */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center glass-container-dark rounded-2xl p-6 border border-orange-500/30 shadow-lg min-w-[240px] max-w-xs self-start md:self-center">
          <div className="text-orange-400 text-base font-bold mb-3 text-center">
            How'd you rate this anime?
          </div>
          <div className="text-4xl font-bold text-white mb-1">
            {score}
          </div>
          <div className="text-zinc-400 text-xs mb-4">
            by {scoreCount} reviews
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`text-3xl transition-all ${
                  i <= Math.round((info.stats?.score || 0) / 2)
                    ? 'text-orange-400'
                    : 'text-zinc-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-purple-300 font-medium">{label}:</span>
      <span className="text-white truncate">{value}</span>
    </div>
  );
}