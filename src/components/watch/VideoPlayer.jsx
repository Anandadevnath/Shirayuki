import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipForward,
  Loader2,
  Captions,
  X,
  Check,
  RotateCcw,
  RotateCw,
} from "lucide-react";

export default function VideoPlayer({
  src,
  subtitleTracks = [],
  introSkip = null,
  outroSkip = null,
  autoPlay = true,
  autoSkipIntro = true,
  onEnded = null,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const tracksInitializedRef = useRef(false);
  const lastSrcRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [showSkipIntroEarly, setShowSkipIntroEarly] = useState(false);
  const [showSkipOutroEarly, setShowSkipOutroEarly] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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
      setSelectedCaption(defaultCaption);
      setIsLoading(true);
      setCurrentTime(0);
      setBuffered(0);
    }
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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
    setShowSettingsMenu(false);
  }, []);

  const handleCaptionSelect = useCallback((label) => {
    setSelectedCaption(label);
    setShowCaptionMenu(false);
  }, []);

  const toggleCaptionMenu = useCallback(() => {
    setShowCaptionMenu(prev => !prev);
    setShowSettingsMenu(false);
  }, []);

  const toggleSettingsMenu = useCallback(() => {
    setShowSettingsMenu(prev => !prev);
    setShowCaptionMenu(false);
  }, []);

  const resetHideControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCaptionMenu && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showCaptionMenu, showSettingsMenu]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

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
        setShowSettingsMenu(false);
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {(showSkipOutroEarly || showSkipOutro) && (
        <button
          onClick={skipOutro}
          className={`absolute bottom-32 right-8 font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 z-20 flex items-center gap-3 shadow-2xl backdrop-blur-xl border-2
            ${showSkipOutroEarly
              ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-purple-400/50 text-white shadow-purple-500/50'
              : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 border-purple-300/50 text-white shadow-purple-400/60 hover:from-purple-400 hover:to-pink-400'}`}
        >
          <SkipForward className="h-6 w-6" />
          <span className="text-lg font-extrabold tracking-wide">{showSkipOutroEarly ? 'SKIP OUTRO' : 'SKIP OUTRO'}</span>
        </button>
      )}

      {/* Modern Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} z-30`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none"></div>

        {/* Content */}
        <div className="relative w-full">
          {/* Progress Bar */}
          <div className="px-2 sm:px-6 pb-2">
            <div
              ref={progressBarRef}
              className="relative h-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-full cursor-pointer group/progress hover:h-2.5 transition-all backdrop-blur-sm"
              onClick={handleSeek}
            >
              {/* Buffered */}
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-700/40 to-purple-700/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Progress */}
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-cyan-500/50"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl shadow-cyan-400/50 opacity-0 group-hover/progress:opacity-100 transition-opacity border-2 border-cyan-300"></div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            className="flex flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 pb-3 w-full overflow-x-auto scrollbar-none"
            style={{ flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', minHeight: 48 }}
          >
            {/* Left Side */}
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 sm:p-3 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 group/btn backdrop-blur-sm"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
                ) : (
                  <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
                title="Rewind 10s"
              >
                <RotateCcw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
                title="Forward 10s"
              >
                <RotateCw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 ml-1 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all backdrop-blur-sm"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-24 transition-all duration-300 h-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-purple-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50"
                />
              </div>

              {/* Time Display */}
              <div className="hidden md:flex items-center text-sm font-mono text-white/90 ml-3 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-cyan-300 font-bold">{formatTime(currentTime)}</span>
                <span className="mx-2 text-white/40">/</span>
                <span className="text-white/70">{formatTime(duration)}</span>
              </div>
            </div>


            {/* Right Side */}
            <div className="flex items-center gap-1">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={toggleSettingsMenu}
                  className={`px-4 py-2 rounded-xl transition-all backdrop-blur-sm font-mono font-bold text-sm ${showSettingsMenu ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300' : 'hover:bg-cyan-500/20 text-white/90 hover:text-cyan-300'}`}
                  title="Playback speed"
                >
                  {playbackRate}x
                </button>

                {showSettingsMenu && (
                  <div className="absolute bottom-full right-0 mb-3 bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 min-w-[180px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-purple-900/20">
                      <span className="text-white font-bold text-sm tracking-wide">PLAYBACK SPEED</span>
                    </div>
                    <div className="py-2">
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 transition-all ${playbackRate === rate ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' : ''}`}
                        >
                          <span className={`font-mono font-bold text-sm ${playbackRate === rate ? 'text-cyan-300' : 'text-white/80'}`}>
                            {rate}x
                          </span>
                          {playbackRate === rate && (
                            <Check className="h-4 w-4 text-cyan-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skip Intro Button (beside 1x) */}
              {(showSkipIntroEarly || (showSkipIntro && !autoSkipIntro)) && (
                <button
                  onClick={skipIntro}
                  className="ml-2 px-4 py-1.5 rounded-full font-bold text-base flex items-center gap-2 bg-transparent text-cyan-600 border-2 border-cyan-400 hover:bg-cyan-50/20 hover:text-cyan-400 transition-all shadow-sm"
                  style={{ fontWeight: 700, letterSpacing: 1, minWidth: 110, borderStyle: 'solid', borderWidth: 2, background: 'transparent' }}
                  title={showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}
                >
                  <SkipForward className="h-5 w-5" />
                  <span className="uppercase tracking-wide">{showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}</span>
                </button>
              )}

              {/* Captions */}
              <div className="relative">
                <button
                  onClick={toggleCaptionMenu}
                  className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${selectedCaption ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300' : 'hover:bg-cyan-500/20 text-white hover:text-cyan-300'
                    }`}
                  title="Captions"
                >
                  <Captions className="h-5 w-5" />
                </button>

                {showCaptionMenu && (
                  <div className="absolute bottom-full right-0 mb-3 bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 min-w-[220px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                      <span className="text-white font-bold text-sm tracking-wide">SUBTITLES</span>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => handleCaptionSelect(null)}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all ${selectedCaption === null ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' : ''
                          }`}
                      >
                        <span className={`text-sm font-semibold ${selectedCaption === null ? 'text-purple-300' : 'text-white/80'}`}>
                          Off
                        </span>
                        {selectedCaption === null && (
                          <Check className="h-4 w-4 text-purple-400" />
                        )}
                      </button>

                      {subtitleTracks.map((track, index) => (
                        <button
                          key={index}
                          onClick={() => handleCaptionSelect(track.label)}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all ${selectedCaption === track.label ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' : ''
                            }`}
                        >
                          <span className={`text-sm font-semibold ${selectedCaption === track.label ? 'text-purple-300' : 'text-white/80'}`}>
                            {track.label}
                          </span>
                          {selectedCaption === track.label && (
                            <Check className="h-4 w-4 text-purple-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>



              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm ml-1"
                title="Fullscreen"
              >
                <Maximize className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center Play Button (smaller) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-20 group/play"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="absolute left-1/2 top-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-xl opacity-50 group-hover/play:opacity-70 transition-opacity" style={{ width: 60, height: 60, transform: 'translate(-50%, -50%)' }}></div>
            <div className="relative flex items-center justify-center p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl rounded-full hover:from-cyan-500/30 hover:to-purple-500/30 transition-all hover:scale-110 border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/30" style={{ width: 60, height: 60 }}>
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}