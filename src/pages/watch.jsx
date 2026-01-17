import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAnimeEpisodes,
  getEpisodeServers,
  getAnimeDetails,
  getEpisodeSources,
} from "@/context/api";
import { Button } from "@/components/ui/button";
import EpisodeSidebar from "@/components/watch/EpisodeSidebar";
import WatchSkeleton from "@/components/watch/WatchSkeleton";
import VideoPlayer from "@/components/watch/VideoPlayer";
import {
  SkipForward,
  SkipBack,
  Plus,
  Captions,
  Mic,
  RotateCcw,
} from "lucide-react";
import AnimeDetailsCard from "@/components/details/AnimeDetailsCard";

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
  const [streamingSources, setStreamingSources] = useState([]);

  // Video player data
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [introSkip, setIntroSkip] = useState(null);
  const [outroSkip, setOutroSkip] = useState(null);

  const [autoPlay, _setAutoPlay] = useState(true);
  const [autoNext, _setAutoNext] = useState(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);
  const [episodeViewMode, setEpisodeViewMode] = useState("list");

  // Reusable function to load video sources
  const loadSources = useCallback(async (episode, server, category) => {
    if (!episode || !server) return;

    setServerLoading(true);

    const sourceRes = await getEpisodeSources(
      animeId,
      episode.episodeId,
      episode.number,
      server.serverName,
      category
    );

    if (!sourceRes.error) {
      const responseData = sourceRes.data || sourceRes;
      const videoData = responseData.video || {};
      const captionsData = responseData.captions || {};
      const skipData = responseData.skip || [];

      let sourcesArray = [];
      const candidates = videoData.sources || videoData.qualities || videoData.renditions || videoData.alternatives || [];
      if (Array.isArray(candidates) && candidates.length) {
        sourcesArray = candidates.map((s) => {
          const urlCandidate = s.file || s.url || s.src || s.path || (s.source && s.source.url) || videoData.source?.url || videoData.url || '';
          const label = s.quality || s.label || (s.res ? `${s.res}p` : (s.height ? `${s.height}p` : (s.label || 'Unknown')));
          return { label: String(label), url: urlCandidate };
        }).filter(s => s.url);
      } else {
        const url = videoData.source?.url || videoData.url || "";
        if (url) sourcesArray = [{ label: 'Auto', url }];
      }

      setStreamingSources(sourcesArray);
      setStreamingUrl(sourcesArray[0]?.url || "");

      const tracks = captionsData.tracks || [];
      setSubtitleTracks(tracks);

      const intro = skipData.find(s => s.name === "Skip Intro");
      const outro = skipData.find(s => s.name === "Skip Outro");
      setIntroSkip(intro || null);
      setOutroSkip(outro || null);
    } else {
      setStreamingUrl("");
      setSubtitleTracks([]);
      setIntroSkip(null);
      setOutroSkip(null);
    }

    setServerLoading(false);
  }, [animeId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Fetch episodes and info in parallel
      const [epsRes, infoRes] = await Promise.all([
        getAnimeEpisodes(animeId),
        getAnimeDetails(animeId),
      ]);

      if (epsRes.error) {
        setError(epsRes.error);
        setLoading(false);
        return;
      }

      const eps = epsRes.data?.data?.episodes || [];
      setEpisodes(eps);

      const current = eps.find((e) => e.episodeId === decodeURIComponent(episodeId)) || eps[0];
      setCurrentEpisode(current);

      if (!infoRes.error) {
        setAnimeInfo(infoRes.data?.data?.anime);
      }

      // Immediately fetch servers for current episode
      if (current) {
        const serverRes = await getEpisodeServers(current.episodeId);

        if (!serverRes.error) {
          const data = serverRes.data?.data || {};
          setServers({
            sub: data.sub || [],
            dub: data.dub || [],
          });

          // Immediately fetch sources for first available server
          const first = data.sub?.[0] || data.dub?.[0];
          if (first) {
            const initialCategory = data.sub?.length ? "sub" : "dub";
            setSelectedServer(first);
            setSelectedCategory(initialCategory);

            // Load video source in background (don't await) ← FIXED HERE
            loadSources(current, first, initialCategory);
          }
        }
      }

      // Set loading to false immediately after essential data loads
      setLoading(false);
    }

    load();
  }, [animeId, episodeId, loadSources]);

  const handleEpisodeSelect = useCallback((ep) => {
    setCurrentEpisode(ep);
    navigate(`/watch/${animeId}/${encodeURIComponent(ep.episodeId)}`, {
      replace: true,
    });
  }, [animeId, navigate]);

  const goPrev = useCallback(() => {
    const i = episodes.findIndex((e) => e === currentEpisode);
    if (i > 0) handleEpisodeSelect(episodes[i - 1]);
  }, [episodes, currentEpisode, handleEpisodeSelect]);

  const goNext = useCallback(() => {
    const i = episodes.findIndex((e) => e === currentEpisode);
    if (i < episodes.length - 1) handleEpisodeSelect(episodes[i + 1]);
  }, [episodes, currentEpisode, handleEpisodeSelect]);

  const handleVideoEnded = useCallback(() => {
    if (autoNext) {
      goNext();
    }
  }, [autoNext, goNext]);

  const handleServerSelect = useCallback(async (server, category) => {
    setSelectedServer(server);
    setSelectedCategory(category);
    await loadSources(currentEpisode, server, category);
  }, [currentEpisode, loadSources]);

  const handleReloadVideo = useCallback(async () => {
    if (!selectedServer || !currentEpisode) return;
    await loadSources(currentEpisode, selectedServer, selectedCategory);
  }, [selectedServer, currentEpisode, selectedCategory, loadSources]);

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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>

      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Player + Sidebar */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Player Section */}
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Video Player */}
          <div className="aspect-video bg-black/50 backdrop-blur-sm relative">
            {streamingUrl && !serverLoading ? (
              <VideoPlayer
                key={streamingUrl}
                src={streamingUrl}
                sources={streamingSources}
                subtitleTracks={subtitleTracks}
                introSkip={introSkip}
                outroSkip={outroSkip}
                autoPlay={autoPlay}
                autoSkipIntro={autoSkipIntro}
                onEnded={handleVideoEnded}
              />
            ) : serverLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4">
                  <RotateCcw className="h-12 w-12 text-purple-400 animate-spin" />
                </div>
                <p className="text-zinc-300 text-lg">Loading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <button
                  onClick={handleReloadVideo}
                  className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4 hover:bg-purple-600/20 transition"
                  title="Reload video"
                  disabled={!selectedServer}
                >
                  <RotateCcw className="h-12 w-12 text-purple-400" />
                </button>
                <p className="text-zinc-300 text-lg">Video failed to load. Click to retry.</p>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col gap-3 px-6 py-4 bg-black/30 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
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
                <button
                  onClick={() => setAutoSkipIntro(v => !v)}
                  title={autoSkipIntro ? 'Auto-Skip Intro: ON' : 'Auto-Skip Intro: OFF'}
                  className={`ml-2 px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center border-2 focus:outline-none font-bold text-sm uppercase tracking-wide
                    ${autoSkipIntro ? 'bg-purple-600/80 border-purple-400 text-white shadow shadow-purple-500/30' : 'bg-white/5 border-zinc-700 text-purple-200 hover:bg-purple-700/20'}`}
                  style={{ minWidth: 40, minHeight: 40 }}
                >
                  AutoSkip
                </button>
              </div>
              <div className="flex gap-2">
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
                {subtitleTracks.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Captions className="h-4 w-4 text-purple-400" />
                    <p className="text-xs text-zinc-400">
                      Subtitles: {subtitleTracks.map(t => t.label).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Server Selection Section */}
          <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 backdrop-blur-xl border-t border-white/10">
            {/* Server Buttons */}
            <div className="flex-1 flex flex-col gap-3 md:gap-4 justify-center order-1 md:order-2">
              {/* SUB Servers */}
              <div className="flex items-start gap-3 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-[65px] pt-1">
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
                        disabled={serverLoading}
                        className={`rounded-xl px-4 md:px-6 py-2 text-sm font-bold transition-all duration-300 ${selectedServer?.serverId === server.serverId &&
                            selectedCategory === "sub"
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/50 scale-105"
                            : "glass-button text-purple-200 hover:text-white hover:scale-105"
                          } ${serverLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className="flex items-start gap-3 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-[65px] pt-1">
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
                        disabled={serverLoading}
                        className={`rounded-xl px-4 md:px-6 py-2 text-sm font-bold transition-all duration-300 ${selectedServer?.serverId === server.serverId &&
                            selectedCategory === "dub"
                            ? "bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white shadow-lg shadow-pink-500/50 scale-105"
                            : "glass-button text-pink-200 hover:text-white hover:scale-105"
                          } ${serverLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {/* Info Box */}
            <div className="glass-container-dark rounded-xl px-5 md:px-6 py-4 md:min-w-[240px] border border-purple-500/30 shadow-lg order-2 md:order-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <p className="font-bold text-sm md:text-base text-purple-200">Now Watching</p>
              </div>
              <p className="text-white font-semibold text-base md:text-lg mb-2">
                Episode {currentEpisode?.number}
              </p>
              <p className="text-purple-200 text-xs leading-relaxed">
                If current server doesn't work, try another server from the options beside.
              </p>
            </div>
          </div>
        </div>

        {/* Episodes Sidebar */}
        <div className="glass-container rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col" style={{ height: '885px' }}>
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

function IconBtn({ icon, onClick, disabled = false, tooltip }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2.5 rounded-xl backdrop-blur-xl transition-all duration-300 ${disabled
          ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
          : 'glass-button hover:scale-110 hover:shadow-lg'
        }`}
    >
      {icon}
    </button>
  );
}