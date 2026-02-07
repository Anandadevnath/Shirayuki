import { useEffect, useState, useCallback, useMemo } from "react";
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

// ========== CONSTANTS ==========
const PREFERRED_SERVER = 'hd-2';
const CATEGORY_TYPES = {
  SUB: 'sub',
  DUB: 'dub',
};

// ========== UTILITIES ==========
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
        label: String(
          s.quality ||
          s.label ||
          (s.res ? `${s.res}p` : s.height ? `${s.height}p` : 'Unknown')
        ),
        url: s.directUrl || s.file || s.url || s.src || s.path || s.source?.directUrl || s.source?.url || videoData.source?.directUrl || videoData.source?.url || videoData.directUrl || videoData.url || '',
      }))
      .filter(s => s.url);
  }

  const url = videoData.source?.directUrl || videoData.directUrl || videoData.source?.url || videoData.url || "";
  return url ? [{ label: 'Auto', url }] : [];
};

const findPreferredServer = (servers, category) => {
  const categoryServers = servers[category] || [];
  return categoryServers.find(s => s.serverName?.toLowerCase() === PREFERRED_SERVER);
};

const getInitialServer = (servers) => {
  const hd2Sub = findPreferredServer(servers, CATEGORY_TYPES.SUB);
  if (hd2Sub) return { server: hd2Sub, category: CATEGORY_TYPES.SUB };

  const hd2Dub = findPreferredServer(servers, CATEGORY_TYPES.DUB);
  if (hd2Dub) return { server: hd2Dub, category: CATEGORY_TYPES.DUB };

  if (servers.sub?.length) return { server: servers.sub[0], category: CATEGORY_TYPES.SUB };
  if (servers.dub?.length) return { server: servers.dub[0], category: CATEGORY_TYPES.DUB };

  return { server: null, category: CATEGORY_TYPES.SUB };
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
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const [epsRes, infoRes] = await Promise.all([
          getAnimeEpisodes(animeId),
          getAnimeDetails(animeId),
        ]);

        if (!mounted) return;

        if (epsRes.error) {
          setState(prev => ({ ...prev, error: epsRes.error, loading: false }));
          return;
        }

        const eps = epsRes.data?.data?.episodes || [];
        const current = eps.find((e) => e.episodeId === decodeURIComponent(episodeId)) || eps[0];
        const info = infoRes.error ? null : infoRes.data?.data?.anime;

        setState(prev => ({
          ...prev,
          episodes: eps,
          currentEpisode: current,
          animeInfo: info,
        }));

        if (current) {
          const serverRes = await getEpisodeServers(current.episodeId);
          if (!mounted) return;

          if (!serverRes.error) {
            const serverData = serverRes.data?.data || {};
            setState(prev => ({
              ...prev,
              servers: {
                sub: serverData.sub || [],
                dub: serverData.dub || [],
              },
              loading: false,
            }));
          } else {
            setState(prev => ({ ...prev, loading: false }));
          }
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({ ...prev, error: err.message, loading: false }));
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [animeId, episodeId]);

  return state;
};

const useVideoSources = (animeId) => {
  const [state, setState] = useState({
    streamingUrl: "",
    streamingSources: [],
    subtitleTracks: [],
    introSkip: null,
    outroSkip: null,
    serverLoading: false,
  });

  const loadSources = useCallback(async (episode, server, category) => {
    if (!episode || !server) return;

    setState(prev => ({ ...prev, serverLoading: true }));

    let episodeNumber = episode.number;
    if (episode.episodeId?.includes('?ep=')) {
      const match = episode.episodeId.match(/\?ep=(\d+)/);
      if (match) episodeNumber = parseInt(match[1], 10);
    }

    try {
      const sourceRes = await getEpisodeSources(
        animeId,
        episode.episodeId,
        episodeNumber,
        server.serverName,
        category
      );

      if (sourceRes.error) {
        setState({
          streamingUrl: "",
          streamingSources: [],
          subtitleTracks: [],
          introSkip: null,
          outroSkip: null,
          serverLoading: false,
        });
        return;
      }

      const responseData = sourceRes.data || sourceRes;
      const apiData = responseData.data || responseData;
      const linkData = apiData.link || {};

      // Use proxy URL to avoid CORS issues
      const proxyUrl = linkData.proxyUrl || linkData.file || "";
      const directUrl = linkData.directUrl || "";

      // Get tracks from the new structure
      const tracks = apiData.tracks || [];

      // For backward compatibility, check old structure
      const videoData = responseData.video || {};
      const captionsData = responseData.captions || {};
      const skipData = responseData.skip || apiData.skip || [];

      let streamingUrl = proxyUrl || directUrl;
      let sourcesArray = [];

      if (streamingUrl) {
        sourcesArray = [{ label: 'Auto', url: streamingUrl }];
      } else {
        // Old API structure fallback
        sourcesArray = extractVideoSources(videoData);
        streamingUrl = sourcesArray[0]?.url || "";
      }

      const subtitleTracks = tracks.length > 0 ? tracks : (captionsData.tracks || []);
      const intro = skipData.find(s => s.name === "Skip Intro") || null;
      const outro = skipData.find(s => s.name === "Skip Outro") || null;

      setState({
        streamingSources: sourcesArray,
        streamingUrl,
        subtitleTracks,
        introSkip: intro,
        outroSkip: outro,
        serverLoading: false,
      });
    } catch {
      setState({
        streamingUrl: "",
        streamingSources: [],
        subtitleTracks: [],
        introSkip: null,
        outroSkip: null,
        serverLoading: false,
      });
    }
  }, [animeId]);

  return { ...state, loadSources };
};

// ========== SUB-COMPONENTS ==========
const BackgroundEffects = () => (
  <>
    <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none" />
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  </>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4">
      <RotateCcw className="h-12 w-12 text-purple-400 animate-spin" />
    </div>
    <p className="text-zinc-300 text-lg">Loading...</p>
  </div>
);

const ReloadButton = ({ onClick, disabled }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <button
      onClick={onClick}
      className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4 hover:bg-purple-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Reload video"
      disabled={disabled}
    >
      <RotateCcw className="h-12 w-12 text-purple-400" />
    </button>
    <p className="text-zinc-300 text-lg">Video failed to load. Click to retry.</p>
  </div>
);

const VideoSection = ({ streamingUrl, serverLoading, handleReloadVideo, selectedServer, videoPlayerProps }) => (
  <div className="aspect-video bg-black/50 backdrop-blur-sm relative">
    {streamingUrl && !serverLoading ? (
      <VideoPlayer key={streamingUrl} {...videoPlayerProps} />
    ) : serverLoading ? (
      <LoadingSpinner />
    ) : (
      <ReloadButton onClick={handleReloadVideo} disabled={!selectedServer} />
    )}
  </div>
);

const IconBtn = ({ icon, onClick, disabled = false, tooltip }) => (
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

const EpisodeInfo = ({ episode, subtitleTracks }) => (
  <div className="px-2 pt-2 border-t border-white/10">
    <h3 className="text-white text-lg font-bold tracking-wide">
      Episode {episode.number}
    </h3>
    {episode.title && (
      <p className="text-purple-300 text-sm font-medium mt-1">
        {episode.title}
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
);

const PlayerControls = ({
  goPrev,
  goNext,
  currentEpisodeIndex,
  episodesLength,
  autoSkipIntro,
  toggleAutoSkip,
  currentEpisode,
  subtitleTracks
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
          title={autoSkipIntro ? 'Auto-Skip Intro: ON' : 'Auto-Skip Intro: OFF'}
          className={`ml-2 px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center border-2 focus:outline-none font-bold text-sm uppercase tracking-wide ${
            autoSkipIntro
              ? 'bg-purple-600/80 border-purple-400 text-white shadow shadow-purple-500/30'
              : 'bg-white/5 border-zinc-700 text-purple-200 hover:bg-purple-700/20'
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
      <EpisodeInfo episode={currentEpisode} subtitleTracks={subtitleTracks} />
    )}
  </div>
);

const ServerRow = ({
  icon,
  label,
  servers,
  category,
  selectedServer,
  selectedCategory,
  serverLoading,
  handleServerSelect,
  colorScheme
}) => (
  <div className="flex items-start gap-3 md:gap-4 flex-wrap">
    <div className="flex items-center gap-2 min-w-[65px] pt-1">
      <div className={`p-1.5 rounded-lg bg-${colorScheme}-500/20 backdrop-blur-sm`}>
        {icon}
      </div>
      <span className="text-white font-bold text-sm">{label}</span>
    </div>
    <div className="flex gap-2 flex-wrap flex-1">
      {servers.length > 0 ? (
        servers.map((server) => (
          <Button
            key={server.serverId}
            onClick={() => handleServerSelect(server, category)}
            disabled={serverLoading}
            className={`rounded-xl px-4 md:px-6 py-2 text-sm font-bold transition-all duration-300 ${
              selectedServer?.serverId === server.serverId && selectedCategory === category
                ? `bg-gradient-to-r from-${colorScheme}-600 to-${colorScheme}-500 hover:from-${colorScheme}-500 hover:to-${colorScheme}-400 text-white shadow-lg shadow-${colorScheme}-500/50 scale-105`
                : `glass-button text-${colorScheme}-200 hover:text-white hover:scale-105`
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
);

const InfoBox = ({ episode }) => (
  <div className="glass-container-dark rounded-xl px-5 md:px-6 py-4 md:min-w-[240px] border border-purple-500/30 shadow-lg order-2 md:order-1">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      <p className="font-bold text-sm md:text-base text-purple-200">Now Watching</p>
    </div>
    <p className="text-white font-semibold text-base md:text-lg mb-2">
      Episode {episode?.number}
    </p>
    <p className="text-purple-200 text-xs leading-relaxed">
      If current server doesn't work, try another server from the options beside.
    </p>
  </div>
);

const ServerSelection = ({
  servers,
  selectedServer,
  selectedCategory,
  serverLoading,
  handleServerSelect,
  currentEpisode
}) => (
  <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 backdrop-blur-xl border-t border-white/10">
    <div className="flex-1 flex flex-col gap-3 md:gap-4 justify-center order-1 md:order-2">
      <ServerRow
        icon={<Captions className="h-4 w-4 text-purple-300" />}
        label="SUB"
        servers={servers.sub}
        category={CATEGORY_TYPES.SUB}
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
        category={CATEGORY_TYPES.DUB}
        selectedServer={selectedServer}
        selectedCategory={selectedCategory}
        serverLoading={serverLoading}
        handleServerSelect={handleServerSelect}
        colorScheme="pink"
      />
    </div>

    <InfoBox episode={currentEpisode} />
  </div>
);

// ========== MAIN COMPONENT ==========
export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();

  const { episodes, servers, animeInfo, currentEpisode, loading, error } =
    useWatchData(animeId, episodeId);

  const {
    streamingUrl,
    streamingSources,
    subtitleTracks,
    introSkip,
    outroSkip,
    serverLoading,
    loadSources
  } = useVideoSources(animeId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_TYPES.SUB);
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);
  const [episodeViewMode, setEpisodeViewMode] = useState("list");

  // Initialize server and load sources when servers/episode change
  useEffect(() => {
    if (!currentEpisode || (!servers.sub?.length && !servers.dub?.length)) return;

    // Only auto-select if no server is selected or the selected server is not in the current list
    const allServers = [...(servers.sub || []), ...(servers.dub || [])];
    const isSelectedServerValid = selectedServer && allServers.some(s => s.serverId === selectedServer.serverId);
    
    if (!isSelectedServerValid) {
      const { server, category } = getInitialServer(servers);
      if (server) {
        Promise.resolve().then(() => {
          setSelectedServer(server);
          setSelectedCategory(category);
        });
        loadSources(currentEpisode, server, category);
      }
    }
  }, [currentEpisode, servers, loadSources, selectedServer]);

  const handleEpisodeSelect = useCallback((ep) => {
    navigate(`/watch/${animeId}/${encodeURIComponent(ep.episodeId)}`, {
      replace: true,
    });
  }, [animeId, navigate]);

  const currentEpisodeIndex = useMemo(() =>
    episodes.findIndex((e) => e === currentEpisode),
    [episodes, currentEpisode]
  );

  const goPrev = useCallback(() => {
    if (currentEpisodeIndex > 0) {
      handleEpisodeSelect(episodes[currentEpisodeIndex - 1]);
    }
  }, [currentEpisodeIndex, episodes, handleEpisodeSelect]);

  const goNext = useCallback(() => {
    if (currentEpisodeIndex < episodes.length - 1) {
      handleEpisodeSelect(episodes[currentEpisodeIndex + 1]);
    }
  }, [currentEpisodeIndex, episodes, handleEpisodeSelect]);

  const handleVideoEnded = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleServerSelect = useCallback((server, category) => {
    setSelectedServer(server);
    setSelectedCategory(category);
    loadSources(currentEpisode, server, category);
  }, [currentEpisode, loadSources]);

  const handleReloadVideo = useCallback(() => {
    if (selectedServer && currentEpisode) {
      loadSources(currentEpisode, selectedServer, selectedCategory);
    }
  }, [selectedServer, currentEpisode, selectedCategory, loadSources]);

  const toggleAutoSkip = useCallback(() => {
    setAutoSkipIntro(prev => !prev);
  }, []);

  const videoPlayerProps = useMemo(() => ({
    src: streamingUrl,
    episodeId: `${animeId}-${currentEpisode?.episodeId}`,
    animeId,
    episodeRealId: currentEpisode?.episodeId,
    serverName: selectedServer?.serverName,
    category: selectedCategory,
    poster: animeInfo?.poster || animeInfo?.coverImage || animeInfo?.image || null,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    sources: streamingSources,
    subtitleTracks,
    introSkip,
    outroSkip,
    autoPlay: true,
    autoSkipIntro,
    onEnded: handleVideoEnded,
  }), [
    streamingUrl,
    animeId,
    currentEpisode,
    selectedServer,
    selectedCategory,
    animeInfo,
    streamingSources,
    subtitleTracks,
    introSkip,
    outroSkip,
    autoSkipIntro,
    handleVideoEnded
  ]);

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

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-8 pb-12">
        <AnimeDetailsCard anime={animeInfo} />
      </div>
    </div>
  );
}