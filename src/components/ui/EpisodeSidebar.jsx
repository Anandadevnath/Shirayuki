import { Search, Play } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function EpisodeSidebar({
  episodes = [],
  currentEpisode,
  onEpisodeSelect,
  searchQuery,
  setSearchQuery,
  episodeViewMode,
  setEpisodeViewMode
}) {
  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ep.number.toString().includes(query) ||
      ep.title?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" style={{scrollbarColor:'#444 #18171c', scrollbarWidth:'thin'}}>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-white font-semibold text-lg">Episodes</span>
        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Find"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-full text-xs py-1"
            />
          </div>
          {/* Organize Button */}
          <button
            title="Switch episode view"
            onClick={() => setEpisodeViewMode(episodeViewMode === 'list' ? 'grid' : 'list')}
            className={`ml-2 p-1 rounded-md border border-zinc-700 text-xs transition-colors ${episodeViewMode === 'grid' ? 'bg-zinc-700 text-orange-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {/* Icon: grid or list */}
            {episodeViewMode === 'grid' ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Episode List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {episodeViewMode === 'grid' ? (
          <div className="grid grid-cols-6 gap-2">
            {filteredEpisodes.map((ep) => {
              const isCurrent = currentEpisode?.episodeId === ep.episodeId;
              return (
                <button
                  key={ep.episodeId}
                  onClick={() => onEpisodeSelect(ep)}
                  className={`rounded-md py-2 text-sm font-semibold transition-colors
                    ${isCurrent ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}
                  `}
                  style={{minWidth: 0}}
                >
                  {ep.number}
                </button>
              );
            })}
          </div>
        ) : (
          filteredEpisodes.map((ep) => {
            const isCurrent = currentEpisode?.episodeId === ep.episodeId;
            return (
              <button
                key={ep.episodeId}
                onClick={() => onEpisodeSelect(ep)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-left mb-1 transition-colors
                  ${isCurrent ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}
                `}
                style={{ fontWeight: isCurrent ? 600 : 400 }}
              >
                <span className={`min-w-[28px] text-base ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>{ep.number}</span>
                <span className="truncate flex-1 text-sm">{ep.title}</span>
                {isCurrent && <Play className="h-4 w-4 text-white flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
