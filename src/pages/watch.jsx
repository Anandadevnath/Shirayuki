import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EpisodeSidebar from "@/components/watch/EpisodeSidebar";
import WatchSkeleton from "@/components/watch/WatchSkeleton";
import VideoPlayer from "@/components/watch/VideoPlayer";
import AnimeDetailsCard from "@/components/details/AnimeDetailsCard";

// Import extracted hooks and components
import { useWatchData, useVideoSources } from "@/hooks/useVideoWatch";
import { getInitialServer } from "@/utils/videoPlayerUtils";

import BackgroundEffects from "@/components/watch/BackgroundEffects";
import VideoSection from "@/components/watch/VideoSection";
import PlayerControls from "@/components/watch/PlayerControls";
import ServerSelection from "@/components/watch/ServerSelection";

const SUB = "sub";
const DUB = "dub";

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