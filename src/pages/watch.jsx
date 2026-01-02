import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getAnimeEpisodes,
  getEpisodeServers,
  getAnimeDetails,
} from "@/context/api";
import { Button } from "@/components/ui/button";
import EpisodeSidebar from "@/components/ui/EpisodeSidebar";
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

/* -------------------- Skeleton -------------------- */
function WatchSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <Skeleton className="aspect-video rounded-2xl bg-white/5" />
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
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
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-black to-[#0f0f14] text-white">
      {/* Player + Sidebar */}
      <div className="max-w-[1500px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Player */}
        <div className="relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="aspect-video bg-black">
            {streamingUrl ? (
              <iframe
                src={streamingUrl}
                allowFullScreen
                className="w-full h-full"
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                {serverLoading ? "Loading servers..." : "Select a server"}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-md border-t border-white/10">
            <div className="flex gap-3">
              <IconBtn onClick={goPrev} icon={<SkipBack />} />
              <IconBtn onClick={goNext} icon={<SkipForward />} />
            </div>

            <div className="flex gap-3">
              <ToggleBtn
                label="Light"
                active={lightOn}
                onClick={() => setLightOn(!lightOn)}
                icon={<Lightbulb />}
              />
              <IconBtn icon={<Expand />} />
              <IconBtn icon={<Plus />} />
              <IconBtn icon={<Radio />} />
            </div>
          </div>

          {/* You are watching & Server Selection Section */}
          <div className="w-full flex flex-col md:flex-row gap-4 mt-6 p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
            {/* Info Box */}
            <div className="bg-[#6d225a] bg-opacity-80 border border-pink-900 rounded-lg px-6 py-4 text-left min-w-[220px] max-w-xs flex-shrink-0">
              <p className="font-semibold text-lg mb-1">You are watching</p>
              <p className="text-pink-300 font-semibold text-base mb-1">
                Episode {currentEpisode?.number}
              </p>
              <p className="text-zinc-200 text-xs">
                If current server doesn't work please try other servers beside.
              </p>
            </div>
            {/* Server Selection */}
            <div className="flex-1 flex flex-col gap-2 min-w-[200px] justify-center">
              {/* SUB Servers */}
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 min-w-[60px]">
                  <Captions className="h-4 w-4 text-purple-400" />
                  <span className="text-white font-medium">SUB:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {servers.sub.length > 0 ? (
                    servers.sub.map((server) => (
                      <Button
                        key={server.serverId}
                        variant={
                          selectedServer?.serverId === server.serverId &&
                            selectedCategory === "sub"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleServerSelect(server, "sub")}
                        className={`rounded-lg px-5 py-1 text-base font-semibold transition-all ${selectedServer?.serverId === server.serverId &&
                            selectedCategory === "sub"
                            ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                            : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                          }`}
                      >
                        {server.serverName.toUpperCase()}
                      </Button>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">Not available</span>
                  )}
                </div>
              </div>
              {/* DUB Servers */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-[60px]">
                  <Mic className="h-4 w-4 text-pink-400" />
                  <span className="text-white font-medium">DUB:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {servers.dub.length > 0 ? (
                    servers.dub.map((server) => (
                      <Button
                        key={server.serverId}
                        variant={
                          selectedServer?.serverId === server.serverId &&
                            selectedCategory === "dub"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleServerSelect(server, "dub")}
                        className={`rounded-lg px-5 py-1 text-base font-semibold transition-all ${selectedServer?.serverId === server.serverId &&
                            selectedCategory === "dub"
                            ? "bg-pink-600 hover:bg-pink-700 text-white shadow-md"
                            : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                          }`}
                      >
                        {server.serverName.toUpperCase()}
                      </Button>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">Not available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes */}
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-4">
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

      {/* Info */}
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        <Link
          to={`/anime/${animeId}`}
          className="text-xl font-semibold hover:text-purple-400 transition"
        >
          {animeInfo?.name}
        </Link>
        <p className="text-zinc-400 mt-1">
          Episode {currentEpisode?.number} • {currentEpisode?.title}
        </p>
      </div>
    </div>
  );
}

/* -------------------- UI Helpers -------------------- */
function IconBtn({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
    >
      {icon}
    </button>
  );
}

function ToggleBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${active ? "bg-purple-600" : "bg-white/10"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
