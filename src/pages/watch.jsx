import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getAnimeEpisodes,
  getEpisodeServers,
  getAnimeDetails,
} from "@/context/api";
import { Button } from "@/components/ui/button";
import EpisodeSidebar from "@/components/watch/EpisodeSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Expand,
  Lightbulb,
  SkipForward,
  SkipBack,
  Plus,
  Radio,
  Captions,
  Mic,
} from "lucide-react";
import AnimeDetailsCard from "@/components/details/AnimeDetailsCard";

/* -------------------- Skeleton -------------------- */
function WatchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <Skeleton className="aspect-video rounded-3xl bg-white/5 backdrop-blur-xl" />
        <div className="space-y-3 max-h-[520px] overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl bg-white/5 backdrop-blur-xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main Page -------------------- */
export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();

  const [episodes, setEpisodes] = useState([]);
  const [servers, setServers] = useState({ sub: [], dub: [], raw: [] });
  const [animeInfo, setAnimeInfo] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);

  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("sub");
  const [streamingUrl, setStreamingUrl] = useState("");

  const [lightOn, setLightOn] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);
  const [episodeViewMode, setEpisodeViewMode] = useState("list");

  /* -------------------- Fetch Episodes -------------------- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [epsRes, infoRes] = await Promise.all([
        getAnimeEpisodes(animeId),
        getAnimeDetails(animeId),
      ]);

      if (epsRes.error) {
        setError(epsRes.error);
        return;
      }

      const eps = epsRes.data?.data?.episodes || [];
      setEpisodes(eps);

      const current =
        eps.find((e) => e.episodeId === decodeURIComponent(episodeId)) ||
        eps[0];

      setCurrentEpisode(current);

      if (!infoRes.error) {
        setAnimeInfo(infoRes.data?.data?.anime);
      }

      setLoading(false);
    }
    load();
  }, [animeId, episodeId]);

  /* -------------------- Fetch Servers -------------------- */
  useEffect(() => {
    if (!currentEpisode) return;

    async function loadServers() {
      setServerLoading(true);
      const res = await getEpisodeServers(currentEpisode.episodeId);

      if (!res.error) {
        const data = res.data?.data || {};
        setServers({
          sub: data.sub || [],
          dub: data.dub || [],
          raw: data.raw || [],
        });

        const first =
          data.sub?.[0] || data.dub?.[0] || data.raw?.[0] || null;

        if (first) {
          setSelectedServer(first);
          setSelectedCategory(data.sub?.length ? "sub" : "dub");
          setStreamingUrl(first.streaming_url);
        }
      }
      setServerLoading(false);
    }

    loadServers();
  }, [currentEpisode]);

  const handleEpisodeSelect = (ep) => {
    setCurrentEpisode(ep);
    navigate(`/watch/${animeId}/${encodeURIComponent(ep.episodeId)}`, {
      replace: true,
    });
  };

  const goPrev = () => {
    const i = episodes.findIndex((e) => e === currentEpisode);
    if (i > 0) handleEpisodeSelect(episodes[i - 1]);
  };

  const goNext = () => {
    const i = episodes.findIndex((e) => e === currentEpisode);
    if (i < episodes.length - 1) handleEpisodeSelect(episodes[i + 1]);
  };

  const handleServerSelect = (server, category) => {
    setSelectedServer(server);
    setSelectedCategory(category);
    setStreamingUrl(server.streaming_url);
  };

  if (loading) return <WatchSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>
        <div className="relative z-10 glass-container px-8 py-6 rounded-2xl">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Gradient overlay matching the reference */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>
      
      {/* Subtle animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Player + Sidebar */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Player Section */}
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Video Player */}
          <div className="aspect-video bg-black/50 backdrop-blur-sm relative">
            {streamingUrl ? (
              <iframe
                src={streamingUrl}
                allowFullScreen
                className="w-full h-full"
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4">
                    <Radio className="h-12 w-12 text-purple-400 animate-pulse" />
                  </div>
                  <p className="text-zinc-300 text-lg">
                    {serverLoading ? "Loading servers..." : "Select a server to start watching"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col gap-3 px-6 py-4 bg-black/30 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <IconBtn 
                  onClick={goPrev} 
                  icon={<SkipBack className="h-5 w-5" />}
                  disabled={episodes.findIndex((e) => e === currentEpisode) === 0}
                />
                <IconBtn 
                  onClick={goNext} 
                  icon={<SkipForward className="h-5 w-5" />}
                  disabled={episodes.findIndex((e) => e === currentEpisode) === episodes.length - 1}
                />
              </div>
              <div className="flex gap-2">
                <ToggleBtn
                  label="Lights"
                  active={lightOn}
                  onClick={() => setLightOn(!lightOn)}
                  icon={<Lightbulb className="h-4 w-4" />}
                />
                <IconBtn icon={<Expand className="h-5 w-5" />} tooltip="Fullscreen" />
                <IconBtn icon={<Plus className="h-5 w-5" />} tooltip="Add to List" />
              </div>
            </div>

            {/* Episode Info */}
            {currentEpisode && (
              <div className="px-2 pt-2 border-t border-white/10">
                <h3 className="text-white text-lg font-bold tracking-wide">
                  Episode {currentEpisode.number}
                </h3>
                {currentEpisode.title && (
                  <p className="text-purple-300 text-sm font-medium mt-1">
                    {currentEpisode.title}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Server Selection Section */}
          <div className="w-full flex flex-col md:flex-row gap-6 px-6 py-5 backdrop-blur-xl border-t border-white/10">
            {/* Info Box */}
            <div className="glass-container-dark rounded-xl px-6 py-4 min-w-[240px] border border-purple-500/30 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <p className="font-bold text-base text-purple-200">Now Watching</p>
              </div>
              <p className="text-white font-semibold text-lg mb-2">
                Episode {currentEpisode?.number}
              </p>
              <p className="text-purple-200 text-xs leading-relaxed">
                If current server doesn't work, try another server from the options beside.
              </p>
            </div>

            {/* Server Buttons */}
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {/* SUB Servers */}
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-[70px] pt-1">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                    <Captions className="h-4 w-4 text-purple-300" />
                  </div>
                  <span className="text-white font-bold text-sm">SUB</span>
                </div>
                <div className="flex gap-2 flex-wrap flex-1">
                  {servers.sub.length > 0 ? (
                    servers.sub.map((server) => (
                      <Button
                        key={server.serverId}
                        onClick={() => handleServerSelect(server, "sub")}
                        className={`rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
                          selectedServer?.serverId === server.serverId &&
                          selectedCategory === "sub"
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/50 scale-105"
                            : "glass-button text-purple-200 hover:text-white hover:scale-105"
                        }`}
                      >
                        {server.serverName.toUpperCase()}
                      </Button>
                    ))
                  ) : (
                    <span className="text-zinc-400 text-sm italic py-2">Not available</span>
                  )}
                </div>
              </div>

              {/* DUB Servers */}
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-[70px] pt-1">
                  <div className="p-1.5 rounded-lg bg-pink-500/20 backdrop-blur-sm">
                    <Mic className="h-4 w-4 text-pink-300" />
                  </div>
                  <span className="text-white font-bold text-sm">DUB</span>
                </div>
                <div className="flex gap-2 flex-wrap flex-1">
                  {servers.dub.length > 0 ? (
                    servers.dub.map((server) => (
                      <Button
                        key={server.serverId}
                        onClick={() => handleServerSelect(server, "dub")}
                        className={`rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
                          selectedServer?.serverId === server.serverId &&
                          selectedCategory === "dub"
                            ? "bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white shadow-lg shadow-pink-500/50 scale-105"
                            : "glass-button text-pink-200 hover:text-white hover:scale-105"
                        }`}
                      >
                        {server.serverName.toUpperCase()}
                      </Button>
                    ))
                  ) : (
                    <span className="text-zinc-400 text-sm italic py-2">Not available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Sidebar */}
        <div className="glass-container rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col" style={{height: '885px'}}>
          <EpisodeSidebar
            episodes={episodes}
            currentEpisode={currentEpisode}
            onEpisodeSelect={handleEpisodeSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            episodeViewMode={episodeViewMode}
            setEpisodeViewMode={setEpisodeViewMode}
          />
        </div>
      </div>

      {/* Anime Details Section */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-8 pb-12">
        <AnimeDetailsCard anime={animeInfo} />
      </div>
    </div>
  );
}

/* -------------------- UI Helpers -------------------- */
function IconBtn({ icon, onClick, disabled = false, tooltip }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2.5 rounded-xl backdrop-blur-xl transition-all duration-300 ${
        disabled 
          ? 'bg-white/5 text-zinc-600 cursor-not-allowed' 
          : 'glass-button hover:scale-110 hover:shadow-lg'
      }`}
    >
      {icon}
    </button>
  );
}

function ToggleBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-xl ${
        active
          ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50 scale-105"
          : "glass-button hover:scale-105"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}