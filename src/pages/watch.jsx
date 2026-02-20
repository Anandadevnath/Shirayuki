import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { SkipForward, SkipBack, Plus, Captions, Mic, RotateCcw } from "lucide-react";
import AnimeDetailsCard from "@/components/details/AnimeDetailsCard";

// ========== CONSTANTS ==========
const PREFERRED_SERVER = "hd-2";
const SUB = "sub";
const DUB = "dub";
const PROXY_URL = import.meta.env.VITE_PROXY_URL;

// ========== UTILITIES ==========
const addProxy = (url) =>
  !url ? "" : url.startsWith(PROXY_URL) ? url : `${PROXY_URL}${encodeURIComponent(url)}`;

const extractVideoSources = (videoData) => {
  const candidates =
    videoData.sources ||
    videoData.qualities ||
    videoData.renditions ||
    videoData.alternatives ||
    [];

  if (Array.isArray(candidates) && candidates.length) {
    return candidates
      .map((s) => ({
        label: String(s.quality || s.label || (s.res ? `${s.res}p` : s.height ? `${s.height}p` : "Unknown")),
        url:
          s.directUrl || s.file || s.url || s.src || s.path ||
          s.source?.directUrl || s.source?.url ||
          videoData.source?.directUrl || videoData.source?.url ||
          videoData.directUrl || videoData.url || "",
      }))
      .filter((s) => s.url);
  }

  const url =
    videoData.source?.directUrl || videoData.directUrl ||
    videoData.source?.url || videoData.url || "";
  return url ? [{ label: "Auto", url }] : [];
};

const getInitialServer = (servers) => {
  const hd2Sub = servers.sub?.find((s) => s.serverName?.toLowerCase() === PREFERRED_SERVER);
  if (hd2Sub) return { server: hd2Sub, category: SUB };

  const hd2Dub = servers.dub?.find((s) => s.serverName?.toLowerCase() === PREFERRED_SERVER);
  if (hd2Dub) return { server: hd2Dub, category: DUB };

  if (servers.sub?.length) return { server: servers.sub[0], category: SUB };
  if (servers.dub?.length) return { server: servers.dub[0], category: DUB };

  return { server: null, category: SUB };
};

const getEpNumber = (episode) => {
  const match = episode.episodeId?.match(/\?ep=(\d+)/);
  return match ? parseInt(match[1], 10) : episode.number;
};

// ========== CUSTOM HOOKS ==========
const useWatchData = (animeId, episodeId) => {
  const [state, setState] = useState({
    episodes: [],
    servers: { sub: [], dub: [] },
    animeInfo: null,
    currentEpisode: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [epsRes, infoRes] = await Promise.all([
          getAnimeEpisodes(animeId),
          getAnimeDetails(animeId),
        ]);
        if (!mounted) return;

        if (epsRes.error) {
          setState((prev) => ({ ...prev, error: epsRes.error, loading: false }));
          return;
        }

        const eps = epsRes.data?.data?.episodes || [];
        const current = eps.find((e) => e.episodeId === decodeURIComponent(episodeId)) || eps[0];
        const info = infoRes.error ? null : infoRes.data?.data?.anime;

        setState((prev) => ({ ...prev, episodes: eps, currentEpisode: current, animeInfo: info }));

        if (!current) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const serverRes = await getEpisodeServers(current.episodeId);
        if (!mounted) return;

        const serverData = serverRes.error ? {} : serverRes.data?.data || {};
        setState((prev) => ({
          ...prev,
          servers: { sub: serverData.sub || [], dub: serverData.dub || [] },
          loading: false,
        }));
      } catch (err) {
        if (mounted) setState((prev) => ({ ...prev, error: err.message, loading: false }));
      }
    };

    load();
    return () => { mounted = false; };
  }, [animeId, episodeId]);

  return state;
};

const EMPTY_SOURCES_STATE = {
  streamingUrl: "",
  streamingSources: [],
  subtitleTracks: [],
  introSkip: null,
  outroSkip: null,
  serverLoading: false,
};

const useVideoSources = (animeId) => {
  const [state, setState] = useState(EMPTY_SOURCES_STATE);
  // Abort controller ref to cancel in-flight requests
  const abortRef = useRef(null);

  const loadSources = useCallback(async (episode, server, category) => {
    if (!episode || !server) return;

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, serverLoading: true }));

    try {
      const sourceRes = await getEpisodeSources(
        animeId,
        episode.episodeId,
        getEpNumber(episode),
        server.serverName,
        category
      );

      if (sourceRes.error) {
        console.error("[Watch] Failed to fetch sources:", sourceRes.error);
        setState(EMPTY_SOURCES_STATE);
        return;
      }

      const apiData = sourceRes.data?.data || sourceRes.data || sourceRes;

      // --- Video sources ---
      let sourcesArray = [];
      const rawSources = apiData.sources || [];
      const linkData = apiData.link || {};

      if (rawSources.length) {
        sourcesArray = rawSources
          .map((s, i) => ({ label: s.quality || `Quality ${i + 1}`, url: addProxy(s.url || "") }))
          .filter((s) => s.url);
      } else if (linkData.proxyUrl || linkData.directUrl || linkData.file) {
        const url = addProxy(linkData.proxyUrl || linkData.file || linkData.directUrl || "");
        sourcesArray = [{ label: "Auto", url }];
      } else {
        const videoData = sourceRes.data?.video || {};
        sourcesArray = extractVideoSources(videoData).map((s) => ({ ...s, url: addProxy(s.url) }));
      }

      const streamingUrl = sourcesArray[0]?.url || "";

      // --- Subtitle tracks ---
      const rawTracks = (apiData.tracks || []).filter(
        (t) => t.lang && t.lang.toLowerCase() !== "thumbnails"
      );
      const captionTracks = sourceRes.data?.captions?.tracks || [];

      const subtitleTracks = (rawTracks.length ? rawTracks : captionTracks).map((t) => ({
        url: t.url || t.file,
        file: t.file || t.url,
        lang: t.lang,
        label: t.label || t.lang,
        kind: t.kind || "subtitles",
        default: false,
      }));

      // --- Intro / Outro ---
      const skipData = sourceRes.data?.skip || apiData.skip || [];
      const findSkip = (name, type) =>
        skipData.find((s) => s.name === name || s.type === type);

      const toSkip = (data) =>
        data?.start !== undefined && data?.end !== undefined
          ? { start: data.start, end: data.end }
          : null;

      const introSkip =
        toSkip(apiData.intro) ||
        toSkip(findSkip("Skip Intro", "intro"));
      const outroSkip =
        toSkip(apiData.outro) ||
        toSkip(findSkip("Skip Outro", "outro"));

      setState({
        streamingSources: sourcesArray,
        streamingUrl,
        subtitleTracks,
        introSkip,
        outroSkip,
        serverLoading: false,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[Watch] Error loading sources:", err);
        setState(EMPTY_SOURCES_STATE);
      }
    }
  }, [animeId]);

  return { ...state, loadSources };
};

// ========== UI SUB-COMPONENTS ==========

const BackgroundEffects = () => (
  <>
    <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none" />
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>
  </>
);

const IconBtn = ({ icon, onClick, disabled = false, tooltip }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-2.5 rounded-xl backdrop-blur-xl transition-all duration-300 ${
      disabled
        ? "bg-white/5 text-zinc-600 cursor-not-allowed"
        : "glass-button hover:scale-110 hover:shadow-lg"
    }`}
  >
    {icon}
  </button>
);

const VideoSection = ({ streamingUrl, serverLoading, handleReloadVideo, selectedServer, videoPlayerProps }) => {
  if (streamingUrl && !serverLoading) {
    return (
      <div className="aspect-video bg-black/50 backdrop-blur-sm relative">
        <VideoPlayer key={streamingUrl} {...videoPlayerProps} />
      </div>
    );
  }
  return (
    <div className="aspect-video bg-black/50 backdrop-blur-sm relative flex flex-col items-center justify-center">
      {serverLoading ? (
        <>
          <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4">
            <RotateCcw className="h-12 w-12 text-purple-400 animate-spin" />
          </div>
          <p className="text-zinc-300 text-lg">Loading...</p>
        </>
      ) : (
        <>
          <button
            onClick={handleReloadVideo}
            disabled={!selectedServer}
            className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4 hover:bg-purple-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reload video"
          >
            <RotateCcw className="h-12 w-12 text-purple-400" />
          </button>
          <p className="text-zinc-300 text-lg">Video failed to load. Click to retry.</p>
        </>
      )}
    </div>
  );
};

const PlayerControls = ({
  goPrev,
  goNext,
  currentEpisodeIndex,
  episodesLength,
  autoSkipIntro,
  toggleAutoSkip,
  currentEpisode,
  subtitleTracks,
}) => (
  <div className="flex flex-col gap-3 px-6 py-4 bg-black/30 backdrop-blur-xl border-t border-white/10">
    <div className="flex items-center justify-between">
      <div className="flex gap-2 items-center">
        <IconBtn
          onClick={goPrev}
          icon={<SkipBack className="h-5 w-5" />}
          disabled={currentEpisodeIndex === 0}
        />
        <IconBtn
          onClick={goNext}
          icon={<SkipForward className="h-5 w-5" />}
          disabled={currentEpisodeIndex === episodesLength - 1}
        />
        <button
          onClick={toggleAutoSkip}
          title={autoSkipIntro ? "Auto-Skip Intro: ON" : "Auto-Skip Intro: OFF"}
          className={`ml-2 px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center border-2 focus:outline-none font-bold text-sm uppercase tracking-wide ${
            autoSkipIntro
              ? "bg-purple-600/80 border-purple-400 text-white shadow shadow-purple-500/30"
              : "bg-white/5 border-zinc-700 text-purple-200 hover:bg-purple-700/20"
          }`}
          style={{ minWidth: 40, minHeight: 40 }}
        >
          AutoSkip
        </button>
      </div>
      <div className="flex gap-2">
        <IconBtn icon={<Plus className="h-5 w-5" />} tooltip="Add to List" />
      </div>
    </div>

    {currentEpisode && (
      <div className="px-2 pt-2 border-t border-white/10">
        <h3 className="text-white text-lg font-bold tracking-wide">Episode {currentEpisode.number}</h3>
        {currentEpisode.title && (
          <p className="text-purple-300 text-sm font-medium mt-1">{currentEpisode.title}</p>
        )}
        {subtitleTracks.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Captions className="h-4 w-4 text-purple-400" />
            <p className="text-xs text-zinc-400">
              Subtitles: {subtitleTracks.map((t) => t.label).join(", ")}
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);

const ServerRow = ({ icon, label, servers, category, selectedServer, selectedCategory, serverLoading, handleServerSelect, colorScheme }) => (
  <div className="flex items-start gap-3 md:gap-4 flex-wrap">
    <div className="flex items-center gap-2 min-w-[65px] pt-1">
      <div className={`p-1.5 rounded-lg bg-${colorScheme}-500/20 backdrop-blur-sm`}>{icon}</div>
      <span className="text-white font-bold text-sm">{label}</span>
    </div>
    <div className="flex gap-2 flex-wrap flex-1">
      {servers.length > 0 ? (
        servers.map((server) => {
          const isActive = selectedServer?.serverId === server.serverId && selectedCategory === category;
          return (
            <Button
              key={server.serverId}
              onClick={() => handleServerSelect(server, category)}
              disabled={serverLoading}
              className={`rounded-xl px-4 md:px-6 py-2 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r from-${colorScheme}-600 to-${colorScheme}-500 hover:from-${colorScheme}-500 hover:to-${colorScheme}-400 text-white shadow-lg shadow-${colorScheme}-500/50 scale-105`
                  : `glass-button text-${colorScheme}-200 hover:text-white hover:scale-105`
              } ${serverLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {server.serverName.toUpperCase()}
            </Button>
          );
        })
      ) : (
        <span className="text-zinc-400 text-sm italic py-2">Not available</span>
      )}
    </div>
  </div>
);

const ServerSelection = ({ servers, selectedServer, selectedCategory, serverLoading, handleServerSelect, currentEpisode }) => (
  <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 backdrop-blur-xl border-t border-white/10">
    <div className="flex-1 flex flex-col gap-3 md:gap-4 justify-center order-1 md:order-2">
      <ServerRow
        icon={<Captions className="h-4 w-4 text-purple-300" />}
        label="SUB"
        servers={servers.sub}
        category={SUB}
        selectedServer={selectedServer}
        selectedCategory={selectedCategory}
        serverLoading={serverLoading}
        handleServerSelect={handleServerSelect}
        colorScheme="purple"
      />
      <ServerRow
        icon={<Mic className="h-4 w-4 text-pink-300" />}
        label="DUB"
        servers={servers.dub}
        category={DUB}
        selectedServer={selectedServer}
        selectedCategory={selectedCategory}
        serverLoading={serverLoading}
        handleServerSelect={handleServerSelect}
        colorScheme="pink"
      />
    </div>
    <div className="glass-container-dark rounded-xl px-5 md:px-6 py-4 md:min-w-[240px] border border-purple-500/30 shadow-lg order-2 md:order-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <p className="font-bold text-sm md:text-base text-purple-200">Now Watching</p>
      </div>
      <p className="text-white font-semibold text-base md:text-lg mb-2">Episode {currentEpisode?.number}</p>
      <p className="text-purple-200 text-xs leading-relaxed">
        If current server doesn't work, try another server from the options beside.
      </p>
    </div>
  </div>
);

// ========== MAIN COMPONENT ==========
export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();

  const { episodes, servers, animeInfo, currentEpisode, loading, error } =
    useWatchData(animeId, episodeId);

  const { streamingUrl, streamingSources, subtitleTracks, introSkip, outroSkip, serverLoading, loadSources } =
    useVideoSources(animeId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(SUB);
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);
  const [episodeViewMode, setEpisodeViewMode] = useState("list");

  useEffect(() => {
    if (!currentEpisode || (!servers.sub?.length && !servers.dub?.length)) return;

    const allServers = [...(servers.sub || []), ...(servers.dub || [])];
    const isValid = selectedServer && allServers.some((s) => s.serverId === selectedServer.serverId);
    if (isValid) return;

    const { server, category } = getInitialServer(servers);
    if (server && server.serverId !== selectedServer?.serverId) {
      queueMicrotask(() => {
        setSelectedServer(server);
        setSelectedCategory(category);
      });
    }
  }, [servers, currentEpisode, selectedServer]);

  useEffect(() => {
    if (currentEpisode && selectedServer) {
      loadSources(currentEpisode, selectedServer, selectedCategory);
    }
  }, [currentEpisode, selectedServer, selectedCategory, loadSources]);

  const handleEpisodeSelect = useCallback(
    (ep) => navigate(`/watch/${animeId}/${encodeURIComponent(ep.episodeId)}`, { replace: true }),
    [animeId, navigate]
  );

  const currentEpisodeIndex = useMemo(
    () => episodes.indexOf(currentEpisode),
    [episodes, currentEpisode]
  );

  const goPrev = useCallback(() => {
    if (currentEpisodeIndex > 0) handleEpisodeSelect(episodes[currentEpisodeIndex - 1]);
  }, [currentEpisodeIndex, episodes, handleEpisodeSelect]);

  const goNext = useCallback(() => {
    if (currentEpisodeIndex < episodes.length - 1) handleEpisodeSelect(episodes[currentEpisodeIndex + 1]);
  }, [currentEpisodeIndex, episodes, handleEpisodeSelect]);

  const handleServerSelect = useCallback(
    (server, category) => {
      setSelectedServer(server);
      setSelectedCategory(category);
      // loadSources is called via the effect above
    },
    []
  );

  const handleReloadVideo = useCallback(() => {
    if (selectedServer && currentEpisode) loadSources(currentEpisode, selectedServer, selectedCategory);
  }, [selectedServer, currentEpisode, selectedCategory, loadSources]);

  const toggleAutoSkip = useCallback(() => setAutoSkipIntro((prev) => !prev), []);

  const poster = useMemo(
    () => animeInfo?.poster || animeInfo?.coverImage || animeInfo?.image || null,
    [animeInfo]
  );

  const videoPlayerProps = useMemo(
    () => ({
      src: streamingUrl,
      episodeId: `${animeId}-${currentEpisode?.episodeId}`,
      animeId,
      episodeRealId: currentEpisode?.episodeId,
      serverName: selectedServer?.serverName,
      category: selectedCategory,
      poster,
      pageUrl: window.location.href,
      sources: streamingSources,
      subtitleTracks,
      introSkip,
      outroSkip,
      autoPlay: true,
      autoSkipIntro,
      onEnded: goNext,
    }),
    [streamingUrl, animeId, currentEpisode, selectedServer, selectedCategory, poster,
     streamingSources, subtitleTracks, introSkip, outroSkip, autoSkipIntro, goNext]
  );

  if (loading) return <WatchSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none" />
        <div className="relative z-10 glass-container px-8 py-6 rounded-2xl">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      <BackgroundEffects />

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          <VideoSection
            streamingUrl={streamingUrl}
            serverLoading={serverLoading}
            handleReloadVideo={handleReloadVideo}
            selectedServer={selectedServer}
            videoPlayerProps={videoPlayerProps}
          />
          <PlayerControls
            goPrev={goPrev}
            goNext={goNext}
            currentEpisodeIndex={currentEpisodeIndex}
            episodesLength={episodes.length}
            autoSkipIntro={autoSkipIntro}
            toggleAutoSkip={toggleAutoSkip}
            currentEpisode={currentEpisode}
            subtitleTracks={subtitleTracks}
          />
          <ServerSelection
            servers={servers}
            selectedServer={selectedServer}
            selectedCategory={selectedCategory}
            serverLoading={serverLoading}
            handleServerSelect={handleServerSelect}
            currentEpisode={currentEpisode}
          />
        </div>

        <div
          className="glass-container rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
          style={{ height: "885px" }}
        >
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

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-8 pb-12">
        <AnimeDetailsCard anime={animeInfo} />
      </div>
    </div>
  );
}