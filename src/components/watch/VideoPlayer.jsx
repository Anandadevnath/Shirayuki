import { useRef, useEffect } from "react";
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

export default function VideoPlayer({
  src,
  subtitleTracks = [],
  introSkip = null,
  outroSkip = null,
  autoPlay = true,
  autoSkipIntro = true,
  onEnded = null,
  episodeId = null, // Add this prop to uniquely identify each episode
}) {

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const videoState = useVideoState(src, autoPlay, subtitleTracks);

  const videoControls = useVideoControls(
    videoRef,
    progressBarRef,
    videoState,
    { introSkip, outroSkip, autoSkipIntro }
  );

  const { showControls, resetHideControlsTimeout } = useControlsVisibility(
    videoState.isPlaying,
    videoControls.showCaptionMenu
  );

  useVideoEventHandlers(
    videoRef,
    videoState,
    videoControls,
    onEnded
  );

  useSubtitleTracks(
    videoRef,
    videoState.selectedCaption,
    subtitleTracks,
    src
  );

  useKeyboardShortcuts(
    videoRef,
    videoControls.togglePlay,
    videoControls.skip,
    videoControls.toggleMute,
    videoControls.toggleFullscreen,
    videoControls.toggleCaptionMenu
  );

  // Save playback position periodically
  useEffect(() => {
    if (!episodeId || !videoRef.current) return;

    const saveInterval = setInterval(() => {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      // Only save if video has meaningful progress and isn't near the end
      if (currentTime > 5 && currentTime < duration - 30) {
        localStorage.setItem(`video_position_${episodeId}`, currentTime.toString());
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [episodeId]);

  // Restore playback position on mount
  useEffect(() => {
    if (!episodeId || !videoRef.current) return;

    const savedPosition = localStorage.getItem(`video_position_${episodeId}`);
    
    if (savedPosition) {
      const position = parseFloat(savedPosition);
      const videoEl = videoRef.current;
      const handleCanPlay = () => {
        if (videoEl && position > 0) {
          videoEl.currentTime = position;
        }
      };

      if (videoEl) {
        videoEl.addEventListener('loadedmetadata', handleCanPlay);
      }

      return () => {
        if (videoEl) {
          videoEl.removeEventListener('loadedmetadata', handleCanPlay);
        }
      };
    }
  }, [episodeId, src]);

  // Clear saved position when video ends
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!episodeId || !videoEl) return;

    const handleEnded = () => {
      localStorage.removeItem(`video_position_${episodeId}`);
    };

    videoEl.addEventListener('ended', handleEnded);

    return () => {
      if (videoEl) {
        videoEl.removeEventListener('ended', handleEnded);
      }
    };
  }, [episodeId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetHideControlsTimeout}
      onMouseLeave={() => {
        videoState.setShowControls(false);
        videoControls.setShowCaptionMenu(false);
      }}
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

      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } z-30`}
      >
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