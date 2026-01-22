import { useRef, useEffect, useCallback, useMemo } from "react";
import { useVideoState } from "../../components/videoPlayer/logic/Usevideostate";
import { useVideoControls } from "../../components/videoPlayer/logic/Usevideocontrols";
import { useVideoEventHandlers } from "../../components/videoPlayer/logic/Usevideoeventhandlers";
import { useSubtitleTracks } from "../../components/videoPlayer/logic/Usesubtitletracks";
import { useKeyboardShortcuts } from "../../components/videoPlayer/logic/Usekeyboardshortcuts";
import { useControlsVisibility } from "../../components/videoPlayer/logic/Usecontrolsvisibility";
import {
  VideoPlayerSpinner,
  VideoPlayerPlayButton,
  VideoPlayerSkipButtons,
} from "../videoPlayer/ui";
import { VideoElement } from "../../components/videoPlayer/logic/Videoelement";
import { ProgressBar } from "../../components/videoPlayer/logic/Progressbar";
import { ControlsBar } from "../../components/videoPlayer/logic/Controlsbar";

import { backendClient } from "@/context/api/client";
import { ENDPOINTS } from "@/context/api/endpoints";

// Constants
const SAVE_INTERVAL_MS = 5000;
const SYNC_INTERVAL_MS = 10000;
const MIN_SAVE_TIME = 5;
const END_THRESHOLD = 30;
const MIN_SYNC_DELTA = 5;

// Storage utilities
const storage = {
  getPosition: (episodeId) => {
    const saved = localStorage.getItem(`video_position_${episodeId}`);
    return saved ? parseFloat(saved) : null;
  },
  setPosition: (episodeId, time) => {
    localStorage.setItem(`video_position_${episodeId}`, time.toString());
  },
  removePosition: (episodeId) => {
    localStorage.removeItem(`video_position_${episodeId}`);
  },
  getUserId: () => localStorage.getItem('userId'),
};

const shouldSaveProgress = (currentTime, duration) => {
  return currentTime > MIN_SAVE_TIME && currentTime < duration - END_THRESHOLD;
};

const shouldSyncProgress = (currentTime, duration, lastSent, force) => {
  if (currentTime <= MIN_SAVE_TIME) return false;
  if (duration && currentTime >= duration - END_THRESHOLD) return false;
  if (!force && Math.abs(currentTime - lastSent) < MIN_SYNC_DELTA) return false;
  return true;
};

const useLocalProgress = (episodeId, videoRef) => {
  useEffect(() => {
    if (!episodeId || !videoRef.current) return;

    const saveInterval = setInterval(() => {
      const { currentTime, duration } = videoRef.current;
      if (shouldSaveProgress(currentTime, duration)) {
        storage.setPosition(episodeId, currentTime);
      }
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(saveInterval);
  }, [episodeId, videoRef]);

  useEffect(() => {
    if (!episodeId || !videoRef.current) return;

    const savedPosition = storage.getPosition(episodeId);
    if (!savedPosition) return;

    const videoEl = videoRef.current;
    const handleCanPlay = () => {
      if (videoEl && savedPosition > 0) {
        videoEl.currentTime = savedPosition;
      }
    };

    videoEl.addEventListener('loadedmetadata', handleCanPlay);
    return () => videoEl.removeEventListener('loadedmetadata', handleCanPlay);
  }, [episodeId, videoRef]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!episodeId || !videoEl) return;

    const handleEnded = () => storage.removePosition(episodeId);
    videoEl.addEventListener('ended', handleEnded);
    return () => videoEl.removeEventListener('ended', handleEnded);
  }, [episodeId, videoRef]);
};

const useBackendSync = (videoRef, syncConfig) => {
  const { animeId, episodeRealId, serverName, category, poster, pageUrl } = syncConfig;

  useEffect(() => {
    if (!animeId || !episodeRealId || !videoRef.current) return;

    const userId = storage.getUserId();
    if (!userId) return;

    let lastSent = 0;
    let mounted = true;

    const sendProgress = async (force = false) => {
      if (!mounted) return;

      try {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const currentTime = Math.floor(videoEl.currentTime);
        const duration = Math.floor(videoEl.duration) || null;

        if (!shouldSyncProgress(currentTime, duration, lastSent, force)) return;

        lastSent = currentTime;
        const endpoint = ENDPOINTS.PROGRESS.UPDATE(userId);
        
        await backendClient.put(endpoint, {
          animeId,
          episodeId: episodeRealId,
          watchedSeconds: currentTime,
          durationSeconds: duration,
          server: serverName ?? null,
          category: category ?? null,
          poster: poster ?? null,
          url: pageUrl ?? (typeof window !== 'undefined' ? window.location.href : null),
        });
      } catch {
        // Silently fail - sync is not critical
      }
    };

    // Initial sync
    sendProgress(false);

    // Periodic sync
    const interval = setInterval(() => sendProgress(false), SYNC_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
      sendProgress(true); // Final sync on unmount
    };
  }, [animeId, episodeRealId, serverName, category, poster, pageUrl, videoRef]);
};

export default function VideoPlayer({
  src,
  subtitleTracks = [],
  introSkip = null,
  outroSkip = null,
  autoPlay = true,
  autoSkipIntro = true,
  onEnded = null,
  episodeId = null,
  animeId = null,
  episodeRealId = null,
  serverName = null,
  category = null,
  poster = null,
  pageUrl = null,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const videoState = useVideoState(src, autoPlay, subtitleTracks);

  const skipConfig = useMemo(
    () => ({ introSkip, outroSkip, autoSkipIntro }),
    [introSkip, outroSkip, autoSkipIntro]
  );

  const videoControls = useVideoControls(
    videoRef,
    progressBarRef,
    videoState,
    skipConfig
  );

  const { showControls, resetHideControlsTimeout } = useControlsVisibility(
    videoState.isPlaying,
    videoControls.showCaptionMenu
  );

  useVideoEventHandlers(videoRef, videoState, videoControls, onEnded);
  useSubtitleTracks(videoRef, videoState.selectedCaption, subtitleTracks, src);
  useKeyboardShortcuts(
    videoRef,
    videoControls.togglePlay,
    videoControls.skip,
    videoControls.toggleMute,
    videoControls.toggleFullscreen,
    videoControls.toggleCaptionMenu
  );

  // Progress tracking
  useLocalProgress(episodeId, videoRef);
  
  const syncConfig = useMemo(
    () => ({ animeId, episodeRealId, serverName, category, poster, pageUrl }),
    [animeId, episodeRealId, serverName, category, poster, pageUrl]
  );
  useBackendSync(videoRef, syncConfig);

  const handleMouseLeave = useCallback(() => {
    videoState.setShowControls(false);
    videoControls.setShowCaptionMenu(false);
  }, [videoState, videoControls]);

  const controlsClassName = useMemo(
    () =>
      `absolute bottom-0 left-0 right-0 transition-all duration-300 z-30 ${
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`,
    [showControls]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetHideControlsTimeout}
      onMouseLeave={handleMouseLeave}
    >
      <VideoElement
        videoRef={videoRef}
        src={src}
        subtitleTracks={subtitleTracks}
        autoPlay={autoPlay}
        togglePlay={videoControls.togglePlay}
      />

      {videoState.isLoading && <VideoPlayerSpinner />}

      <VideoPlayerSkipButtons
        showSkipIntroEarly={videoState.showSkipIntroEarly}
        showSkipIntro={videoState.showSkipIntro}
        autoSkipIntro={autoSkipIntro}
        skipIntro={videoControls.skipIntro}
        showSkipOutroEarly={videoState.showSkipOutroEarly}
        showSkipOutro={videoState.showSkipOutro}
        skipOutro={videoControls.skipOutro}
      />

      <div className={controlsClassName}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />

        <div className="relative w-full">
          <ProgressBar
            progressBarRef={progressBarRef}
            currentTime={videoState.currentTime}
            duration={videoState.duration}
            buffered={videoState.buffered}
            onSeek={videoControls.handleProgressBarInteraction}
          />

          <ControlsBar
            isPlaying={videoState.isPlaying}
            togglePlay={videoControls.togglePlay}
            skip={videoControls.skip}
            isMuted={videoState.isMuted}
            toggleMute={videoControls.toggleMute}
            volume={videoState.volume}
            handleVolumeChange={videoControls.handleVolumeChange}
            currentTime={videoState.currentTime}
            duration={videoState.duration}
            formatTime={videoControls.formatTime}
            playbackRate={videoState.playbackRate}
            changePlaybackRate={videoControls.changePlaybackRate}
            playbackRates={videoControls.playbackRates}
            selectedCaption={videoState.selectedCaption}
            toggleCaptionMenu={videoControls.toggleCaptionMenu}
            showCaptionMenu={videoControls.showCaptionMenu}
            handleCaptionSelect={videoControls.handleCaptionSelect}
            subtitleTracks={subtitleTracks}
            toggleFullscreen={videoControls.toggleFullscreen}
          />
        </div>
      </div>

      {!videoState.isPlaying && !videoState.isLoading && (
        <VideoPlayerPlayButton onClick={videoControls.togglePlay} />
      )}
    </div>
  );
}