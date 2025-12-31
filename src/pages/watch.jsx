import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnimeEpisodes, getEpisodeServers, getAnimeDetails } from "@/context/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Play,
  Expand,
  Lightbulb,
  SkipForward,
  SkipBack,
  Plus,
  Radio,
  ChevronLeft,
  ChevronRight,
  Captions,
  Mic,
} from "lucide-react";

function WatchSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Sidebar Skeleton */}
      <div className="w-full lg:w-80 bg-zinc-900 border-r border-zinc-800 p-4">
        <Skeleton className="h-6 w-32 mb-4 bg-zinc-800" />
        <Skeleton className="h-10 w-full mb-4 bg-zinc-800" />
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
          ))}
        </div>
      </div>
      {/* Player Skeleton */}
      <div className="flex-1 p-4">
        <Skeleton className="w-full aspect-video bg-zinc-800 rounded-lg" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-10 w-24 bg-zinc-800" />
          <Skeleton className="h-10 w-24 bg-zinc-800" />
          <Skeleton className="h-10 w-24 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

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

  // Player settings
  const [lightOn, setLightOn] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);

  // Fetch episodes and anime info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const [episodesRes, detailsRes] = await Promise.all([
        getAnimeEpisodes(animeId),
        getAnimeDetails(animeId),
      ]);

      if (episodesRes.error) {
        setError(episodesRes.error);
      } else {
        const episodesList = episodesRes.data.data.episodes || [];
        setEpisodes(episodesList);

        // Find current episode
        if (episodeId) {
          const current = episodesList.find(
            (ep) => ep.episodeId === decodeURIComponent(episodeId)
          );
          setCurrentEpisode(current || episodesList[0]);
        } else if (episodesList.length > 0) {
          setCurrentEpisode(episodesList[0]);
        }
      }

      if (!detailsRes.error && detailsRes.data?.data?.anime?.info) {
        setAnimeInfo(detailsRes.data.data.anime.info);
      }

      setLoading(false);
    }
    fetchData();
  }, [animeId, episodeId]);

  // Fetch servers when episode changes
  useEffect(() => {
    async function fetchServers() {
      if (!currentEpisode) return;

      setServerLoading(true);
      const serversRes = await getEpisodeServers(currentEpisode.episodeId);

      if (!serversRes.error && serversRes.data?.data) {
        const serverData = serversRes.data.data;
        setServers({
          sub: serverData.sub || [],
          dub: serverData.dub || [],
          raw: serverData.raw || [],
        });

        // Auto-select first available server
        if (serverData.sub?.length > 0) {
          setSelectedCategory("sub");
          setSelectedServer(serverData.sub[0]);
          setStreamingUrl(serverData.sub[0].streaming_url);
        } else if (serverData.dub?.length > 0) {
          setSelectedCategory("dub");
          setSelectedServer(serverData.dub[0]);
          setStreamingUrl(serverData.dub[0].streaming_url);
        }
      }
      setServerLoading(false);
    }
    fetchServers();
  }, [currentEpisode]);

  const handleServerSelect = (server, category) => {
    setSelectedServer(server);
    setSelectedCategory(category);
    setStreamingUrl(server.streaming_url);
  };

  const handleEpisodeSelect = (episode) => {
    setCurrentEpisode(episode);
    navigate(`/watch/${animeId}/${encodeURIComponent(episode.episodeId)}`, {
      replace: true,
    });
  };

  const goToPrevEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = episodes.findIndex(
      (ep) => ep.episodeId === currentEpisode.episodeId
    );
    if (currentIndex > 0) {
      handleEpisodeSelect(episodes[currentIndex - 1]);
    }
  };

  const goToNextEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = episodes.findIndex(
      (ep) => ep.episodeId === currentEpisode.episodeId
    );
    if (currentIndex < episodes.length - 1) {
      handleEpisodeSelect(episodes[currentIndex + 1]);
    }
  };

  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ep.number.toString().includes(query) ||
      ep.title?.toLowerCase().includes(query)
    );
  });

  if (loading) return <WatchSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-zinc-400">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row min-h-[calc(100vh-64px)] ${!lightOn ? "bg-black" : ""}`}>
      {/* Episode List Sidebar */}
      <div className="w-full lg:w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold mb-3">List of episodes:</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Number of Ep"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredEpisodes.map((ep) => (
              <button
                key={ep.episodeId}
                onClick={() => handleEpisodeSelect(ep)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  currentEpisode?.episodeId === ep.episodeId
                    ? "bg-pink-500/20 text-pink-400"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span
                  className={`font-semibold min-w-[24px] ${
                    currentEpisode?.episodeId === ep.episodeId
                      ? "text-pink-400"
                      : "text-zinc-500"
                  }`}
                >
                  {ep.number}
                </span>
                <span className="truncate flex-1">{ep.title}</span>
                {currentEpisode?.episodeId === ep.episodeId && (
                  <Play className="h-4 w-4 text-pink-400 flex-shrink-0" />
                )}
                {ep.isFiller && (
                  <Badge className="text-[10px] px-1 py-0 bg-orange-600 flex-shrink-0">
                    Filler
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="w-full aspect-video bg-black relative">
          {streamingUrl ? (
            <iframe
              src={streamingUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              frameBorder="0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {serverLoading ? (
                <div className="text-zinc-400">Loading servers...</div>
              ) : (
                <div className="text-zinc-400">Select a server to play</div>
              )}
            </div>
          )}
        </div>

        {/* Player Controls */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <button className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors">
              <Expand className="h-4 w-4" />
              <span>Expand</span>
            </button>

            <button
              onClick={() => setLightOn(!lightOn)}
              className={`flex items-center gap-1 transition-colors ${
                lightOn ? "text-yellow-400" : "text-zinc-500"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span>Light</span>
              <span className={lightOn ? "text-green-400" : "text-zinc-500"}>
                {lightOn ? "On" : "Off"}
              </span>
            </button>

            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Auto Play</span>
              <span className={autoPlay ? "text-green-400" : "text-zinc-500"}>
                {autoPlay ? "On" : "Off"}
              </span>
            </button>

            <button
              onClick={() => setAutoNext(!autoNext)}
              className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Auto Next</span>
              <span className={autoNext ? "text-green-400" : "text-zinc-500"}>
                {autoNext ? "On" : "Off"}
              </span>
            </button>

            <button
              onClick={() => setAutoSkipIntro(!autoSkipIntro)}
              className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Auto Skip Intro</span>
              <span className={autoSkipIntro ? "text-green-400" : "text-zinc-500"}>
                {autoSkipIntro ? "On" : "Off"}
              </span>
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevEpisode}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                disabled={!currentEpisode || episodes.indexOf(currentEpisode) === 0}
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={goToNextEpisode}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                disabled={
                  !currentEpisode ||
                  episodes.indexOf(currentEpisode) === episodes.length - 1
                }
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Plus className="h-5 w-5" />
              </button>
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Radio className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Episode Info & Server Selection */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Episode Info Box */}
            <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg px-4 py-3 text-center lg:text-left">
              <p className="text-white font-medium">
                You are watching
              </p>
              <p className="text-pink-400 font-semibold">
                Episode {currentEpisode?.number}
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                If current server doesn't work<br />
                please try other servers beside.
              </p>
            </div>

            {/* Server Selection */}
            <div className="flex-1 space-y-3">
              {/* SUB Servers */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-[80px]">
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
                        className={`${
                          selectedServer?.serverId === server.serverId &&
                          selectedCategory === "sub"
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
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
                <div className="flex items-center gap-2 min-w-[80px]">
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
                        className={`${
                          selectedServer?.serverId === server.serverId &&
                          selectedCategory === "dub"
                            ? "bg-pink-600 hover:bg-pink-700 text-white"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
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

        {/* Anime Title */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3">
          <Link
            to={`/anime/${animeId}`}
            className="text-lg font-semibold text-white hover:text-purple-400 transition-colors"
          >
            {animeInfo?.name || animeId}
          </Link>
          {currentEpisode && (
            <p className="text-zinc-400 text-sm">
              Episode {currentEpisode.number}: {currentEpisode.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
