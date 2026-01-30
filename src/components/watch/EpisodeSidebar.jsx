import { useMemo } from "react";
import { Search, Play, Grid3x3, List } from "lucide-react";
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
  const filteredEpisodes = useMemo(() => {
    return episodes.filter((ep) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        ep.number.toString().includes(query) ||
        ep.title?.toLowerCase().includes(query)
      );
    });
  }, [episodes, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-white font-bold text-xl tracking-wide">Episodes</h2>
          
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-32">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300" />
              <Input
                type="text"
                placeholder="Find"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-purple-200/50 rounded-full text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>

            {/* View Toggle Button */}
            <button
              onClick={() => setEpisodeViewMode(episodeViewMode === 'list' ? 'grid' : 'list')}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 text-purple-200 hover:text-white hover:bg-white/15 hover:scale-105 transition-all duration-300"
              title={episodeViewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
            >
              {episodeViewMode === 'list' ? (
                <Grid3x3 className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Episode List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filteredEpisodes.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-400 text-sm italic">No episodes found</p>
          </div>
        ) : episodeViewMode === 'grid' ? (
          <div className="grid grid-cols-6 gap-2">
            {filteredEpisodes.map((ep) => {
              const isCurrent = currentEpisode?.episodeId === ep.episodeId;
              return (
                <button
                  key={ep.episodeId}
                  onClick={() => onEpisodeSelect(ep)}
                  className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 backdrop-blur-xl ${
                    isCurrent
                      ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50 ring-2 ring-purple-400/50'
                      : 'glass-button-subtle hover:bg-white/20 hover:shadow-md hover:shadow-purple-500/20 hover:-translate-y-0.5'
                  }`}
                  title={ep.title || `Episode ${ep.number}`}
                >
                  {ep.number}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEpisodes.map((ep) => {
              const isCurrent = currentEpisode?.episodeId === ep.episodeId;
              return (
                <button
                  key={ep.episodeId}
                  onClick={() => onEpisodeSelect(ep)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 backdrop-blur-xl group ${
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                      : 'glass-button-subtle hover:bg-white/20 hover:shadow-md hover:shadow-purple-500/20 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Episode Number Badge */}
                  <div className={`flex items-center justify-center min-w-[50px] h-[42px] rounded-lg font-bold text-base transition-all ${
                    isCurrent 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-purple-300 group-hover:bg-white/20 group-hover:text-white'
                  }`}>
                    {ep.number}
                  </div>

                  {/* Episode Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-sm font-semibold ${
                      isCurrent ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                    }`}>
                      {ep.title || `Episode ${ep.number}`}
                    </p>
                    {ep.title && (
                      <p className={`text-xs mt-0.5 ${
                        isCurrent ? 'text-purple-100' : 'text-zinc-400 group-hover:text-zinc-300'
                      }`}>
                        EP {ep.number}
                      </p>
                    )}
                  </div>

                  {/* Play Icon for Current Episode */}
                  {isCurrent && (
                    <div className="flex-shrink-0 p-2 rounded-lg bg-white/20">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}