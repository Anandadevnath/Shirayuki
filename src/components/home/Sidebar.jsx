import { useState, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const SIDEBAR_CARD_HEIGHT = 100;
const MAX_SIDEBAR_ITEMS = 10;

// Reusable Sidebar Item Component
export const SidebarAnimeItem = memo(function SidebarAnimeItem({ anime, index, accentColor = "pink" }) {
  const colorClasses = accentColor === "pink" 
    ? "border-pink-500/60 from-pink-500/60 to-pink-500/60"
    : "border-teal-500/60 from-teal-500/60 to-teal-500/60";
  
  return (
    <Link
      to={`/anime/${anime.id}`}
      className={`relative flex items-center h-[${SIDEBAR_CARD_HEIGHT}px] rounded-xl overflow-hidden group`}
    >
      <div className="absolute inset-0">
        <img
          src={anime.poster}
          alt={anime.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/95 via-zinc-900/60 to-zinc-900/30" />
      </div>
      <div className="relative flex items-center gap-4 p-4 w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-[2px] h-5 bg-gradient-to-b from-transparent ${colorClasses.split(' ')[1]}`} />
            <div className={`w-11 h-11 flex items-center justify-center rounded-full border-2 ${colorClasses.split(' ')[0]} text-white font-bold text-lg`}>
              {anime.rank || index + 1}
            </div>
            <div className={`w-[2px] h-5 bg-gradient-to-t from-transparent ${colorClasses.split(' ')[2]}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base truncate mb-2 group-hover:text-orange-400 transition-colors">
            {anime.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {anime.episodes?.sub && (
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">
                CC {anime.episodes.sub}
              </Badge>
            )}
            {anime.episodes?.dub && (
              <Badge className="bg-green-600 hover:bg-green-600 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-0.5">
                🎙️ {anime.episodes.dub}
              </Badge>
            )}
            {anime.type && (
              <span className="text-zinc-300 text-xs uppercase font-medium">{anime.type}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

// Reusable Tabbed Sidebar Component
export const TabbedSidebar = memo(function TabbedSidebar({ tabs, accentColor = "pink" }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  
  const currentData = useMemo(() => 
    tabs.find(tab => tab.id === activeTab)?.data || [],
    [tabs, activeTab]
  );

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 h-fit sticky top-24">
      <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-pink-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {currentData.slice(0, MAX_SIDEBAR_ITEMS).map((anime, index) => (
          <SidebarAnimeItem 
            key={anime.id} 
            anime={anime} 
            index={index} 
            accentColor={accentColor} 
          />
        ))}
      </div>
    </div>
  );
});

// Top 10 Sidebar (Today, Week, Month)
export const Top10Sidebar = memo(function Top10Sidebar({ top10Animes }) {
  const tabs = useMemo(() => [
    { id: 'today', label: 'Today', data: top10Animes?.today },
    { id: 'week', label: 'Week', data: top10Animes?.week },
    { id: 'month', label: 'Month', data: top10Animes?.month },
  ], [top10Animes]);

  return <TabbedSidebar tabs={tabs} accentColor="pink" />;
});

// Top Animes Sidebar (Latest Completed, Most Popular, Most Favorite)
export const TopAnimesSidebar = memo(function TopAnimesSidebar({ latestCompleted, mostPopular, mostFavorite }) {
  const tabs = useMemo(() => [
    { id: 'completed', label: 'Completed', data: latestCompleted },
    { id: 'popular', label: 'Popular', data: mostPopular },
    { id: 'favorite', label: 'Favorite', data: mostFavorite },
  ], [latestCompleted, mostPopular, mostFavorite]);

  return <TabbedSidebar tabs={tabs} accentColor="teal" />;
});
