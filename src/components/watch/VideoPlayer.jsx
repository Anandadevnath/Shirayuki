import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  VideoPlayerSpinner,
  VideoPlayerPlayButton,
  VideoPlayerSkipButtons,
  VideoPlayerControls,
} from "./ui";

export default function VideoPlayer({
  src,
  _sources = [],
  subtitleTracks = [],
  introSkip = null,
  outroSkip = null,
  autoPlay = true,
  autoSkipIntro = true,
  onEnded = null,
}) {
  const videoRef = useRef(null);
  void _sources;
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const tracksInitializedRef = useRef(false);
  const lastSrcRef = useRef(null);
  const resetStateTimeoutRef = useRef(null);
  const showControlsSyncTimeoutRef = useRef(null);

  const isPlayingRef = useRef(autoPlay);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const isFullscreenRef = useRef(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [showSkipIntroEarly, setShowSkipIntroEarly] = useState(false);
  const [showSkipOutroEarly, setShowSkipOutroEarly] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);



  const defaultCaption = useMemo(() => {
    const defaultTrack = subtitleTracks.find(t => t.default);
    return defaultTrack ? defaultTrack.label : null;
  }, [subtitleTracks]);

  const [selectedCaption, setSelectedCaption] = useState(defaultCaption);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (lastSrcRef.current !== src) {
      lastSrcRef.current = src;
      tracksInitializedRef.current = false;

      if (resetStateTimeoutRef.current) {
        clearTimeout(resetStateTimeoutRef.current);
      }

      resetStateTimeoutRef.current = setTimeout(() => {
        setSelectedCaption(defaultCaption);
        setIsLoading(true);
        setCurrentTime(0);
        setBuffered(0);
        resetStateTimeoutRef.current = null;
      }, 0);
    }

    return () => {
      if (resetStateTimeoutRef.current) {
        clearTimeout(resetStateTimeoutRef.current);
        resetStateTimeoutRef.current = null;
      }
    };
  }, [src, defaultCaption]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);

      if (!tracksInitializedRef.current && video.textTracks.length > 0) {
        tracksInitializedRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      if (introSkip) {
        const { start, end } = introSkip;
        const showEarly = 5;

        if (time >= start - showEarly && time < start) {
          setShowSkipIntroEarly(true);
          setShowSkipIntro(false);
        } else if (time >= start && time < end) {
          setShowSkipIntroEarly(false);
          setShowSkipIntro(true);
          if (autoSkipIntro) {
            video.currentTime = end;
            setShowSkipIntro(false);
          }
        } else if (showSkipIntro || showSkipIntroEarly) {
          setShowSkipIntroEarly(false);
          setShowSkipIntro(false);
        }
      }

      if (outroSkip) {
        const { start, end } = outroSkip;
        const showEarly = 5;

        if (time >= start - showEarly && time < start) {
          setShowSkipOutroEarly(true);
          setShowSkipOutro(false);
        } else if (time >= start && time < end) {
          setShowSkipOutroEarly(false);
          setShowSkipOutro(true);
        } else if (showSkipOutro || showSkipOutroEarly) {
          setShowSkipOutroEarly(false);
          setShowSkipOutro(false);
        }
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, [introSkip, outroSkip, autoSkipIntro, onEnded, showSkipIntro, showSkipIntroEarly, showSkipOutro, showSkipOutroEarly]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setTracks = () => {
      const tracks = video.textTracks;
      if (tracks.length === 0) return;

      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }

      if (selectedCaption !== null) {
        for (let i = 0; i < tracks.length; i++) {
          if (subtitleTracks[i]?.label === selectedCaption) {
            tracks[i].mode = 'showing';
            break;
          }
        }
      }
    };

    if (video.textTracks.length === 0) {
      const timer = setTimeout(setTracks, 100);
      return () => clearTimeout(timer);
    } else {
      setTracks();
    }
  }, [selectedCaption, subtitleTracks, src]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      isFullscreenRef.current = true;
    } else {
      document.exitFullscreen();
      isFullscreenRef.current = false;
    }
  }, []);

  const skipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video || !introSkip) return;
    video.currentTime = introSkip.end;
    setShowSkipIntro(false);
  }, [introSkip]);

  const skipOutro = useCallback(() => {
    const video = videoRef.current;
    if (!video || !outroSkip) return;
    video.currentTime = outroSkip.end;
    setShowSkipOutro(false);
  }, [outroSkip]);

  const skip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
  }, []);

  const changePlaybackRate = useCallback((rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleCaptionSelect = useCallback((label) => {
    setSelectedCaption(label);
    setShowCaptionMenu(false);
  }, []);

  const toggleCaptionMenu = useCallback(() => {
    setShowCaptionMenu(prev => !prev);
  }, []);

  const resetHideControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlayingRef.current && !showCaptionMenu) {
        setShowControls(false);
      }
    }, 3000);
  }, [showCaptionMenu]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (!isPlaying) {
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
      }
      // Defer to next tick to avoid lint rule for setState in effect
      showControlsSyncTimeoutRef.current = setTimeout(() => {
        setShowControls(true);
        showControlsSyncTimeoutRef.current = null;
      }, 0);

      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    } else {
      // Clear any pending show-controls timer when playback resumes
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
        showControlsSyncTimeoutRef.current = null;
      }
    }

    return () => {
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
        showControlsSyncTimeoutRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
          e.preventDefault();
          toggleCaptionMenu();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [togglePlay, skip, toggleMute, toggleFullscreen, toggleCaptionMenu]);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetHideControlsTimeout}
      onMouseLeave={() => {
        setShowControls(false);
        setShowCaptionMenu(false);
      }}
    >
      <style>{`
        video::cue {
          background: none !important;
          color: white;
          text-shadow: 2px 2px 4px #000, 0 0 2px #000;
          font-size: 1em;
        }
      `}</style>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        crossOrigin="anonymous"
        autoPlay={autoPlay}
        preload="metadata"
      >
        {subtitleTracks.map((track, index) => (
          <track
            key={`${src}-${index}`}
            kind={track.kind || "captions"}
            src={track.file}
            srcLang={track.label?.toLowerCase().slice(0, 2) || "en"}
            label={track.label}
            default={track.default || false}
          />
        ))}
      </video>

      {/* Loading Spinner */}
      {isLoading && <VideoPlayerSpinner />}

      <VideoPlayerSkipButtons
        showSkipIntroEarly={showSkipIntroEarly}
        showSkipIntro={showSkipIntro}
        autoSkipIntro={autoSkipIntro}
        skipIntro={skipIntro}
        showSkipOutroEarly={showSkipOutroEarly}
        showSkipOutro={showSkipOutro}
        skipOutro={skipOutro}
      />

      {/* Modern Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} z-30`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none"></div>
        <div className="relative w-full">
          <div className="px-2 sm:px-6 pb-2">
            <div
              ref={progressBarRef}
              className="relative h-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-full cursor-pointer group/progress hover:h-2.5 transition-all backdrop-blur-sm"
              onClick={handleSeek}
            >
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-700/40 to-purple-700/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-cyan-500/50"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl shadow-cyan-400/50 opacity-0 group-hover/progress:opacity-100 transition-opacity border-2 border-cyan-300"></div>
              </div>
            </div>
          </div>
          <VideoPlayerControls
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            skip={skip}
            isMuted={isMuted}
            toggleMute={toggleMute}
            volume={volume}
            handleVolumeChange={handleVolumeChange}
            currentTime={currentTime}
            duration={duration}
            formatTime={formatTime}
            playbackRate={playbackRate}
            changePlaybackRate={changePlaybackRate}
            playbackRates={playbackRates}
            showSkipIntroEarly={showSkipIntroEarly}
            showSkipIntro={showSkipIntro}
            autoSkipIntro={autoSkipIntro}
            skipIntro={skipIntro}
            selectedCaption={selectedCaption}
            toggleCaptionMenu={toggleCaptionMenu}
            showCaptionMenu={showCaptionMenu}
            handleCaptionSelect={handleCaptionSelect}
            subtitleTracks={subtitleTracks}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>

      {/* Center Play Button (smaller) */}
      {!isPlaying && !isLoading && (
        <VideoPlayerPlayButton onClick={togglePlay} />
      )}
    </div>
  );
}