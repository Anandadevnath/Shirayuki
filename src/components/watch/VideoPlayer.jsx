import { useEffect, useState, useRef } from "react";
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
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Caption controls - Initialize with default track
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState(() => {
    const defaultTrack = subtitleTracks.find(t => t.default);
    return defaultTrack ? defaultTrack.label : null;
  });

  const hideControlsTimeoutRef = useRef(null);
  const tracksInitializedRef = useRef(false);

  // DEBUG: Log subtitle tracks when component receives them
  useEffect(() => {
    console.log('=== VideoPlayer Subtitle Debug ===');
    console.log('Subtitle tracks received:', subtitleTracks);
    console.log('Number of tracks:', subtitleTracks.length);
    console.log('Selected caption:', selectedCaption);
    subtitleTracks.forEach((track, i) => {
      console.log(`Track ${i}:`, {
        label: track.label,
        file: track.file,
        default: track.default
      });
    });
  }, [subtitleTracks, selectedCaption]);

  // Format time helper
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      
      // Initialize subtitle tracks properly
      if (!tracksInitializedRef.current && video.textTracks.length > 0) {
        console.log('Video textTracks loaded:', video.textTracks.length);
        const defaultTrack = subtitleTracks.find(t => t.default);
        if (defaultTrack) {
          console.log('Setting default track:', defaultTrack.label);
          setSelectedCaption(defaultTrack.label);
        }
        tracksInitializedRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check for intro skip
      if (introSkip && video.currentTime >= introSkip.start && video.currentTime < introSkip.end) {
        setShowSkipIntro(true);
        if (autoSkipIntro) {
          video.currentTime = introSkip.end;
          setShowSkipIntro(false);
        }
      } else {
        setShowSkipIntro(false);
      }

      // Check for outro skip
      if (outroSkip && video.currentTime >= outroSkip.start && video.currentTime < outroSkip.end) {
        setShowSkipOutro(true);
      } else {
        setShowSkipOutro(false);
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
      if (onEnded) onEnded();
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
  }, [introSkip, outroSkip, autoSkipIntro, onEnded, subtitleTracks]);

  // Handle subtitle track changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const checkAndSetTracks = () => {
      const tracks = video.textTracks;
      
      console.log('Checking tracks - Count:', tracks.length);
      
      if (tracks.length === 0) {
        setTimeout(checkAndSetTracks, 100);
        return;
      }

      // Disable all tracks first
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }

      // Enable the selected track
      if (selectedCaption !== null) {
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          if (subtitleTracks[i]?.label === selectedCaption) {
            track.mode = 'showing';
            console.log(`✓ Enabled subtitle: ${selectedCaption} (track ${i})`);
            break;
          }
        }
      } else {
        console.log('All subtitles disabled');
      }
    };

    checkAndSetTracks();
  }, [selectedCaption, subtitleTracks, src]);

  // Reset tracks when video source changes
  useEffect(() => {
    tracksInitializedRef.current = false;
    const defaultTrack = subtitleTracks.find(t => t.default);
    setSelectedCaption(defaultTrack ? defaultTrack.label : null);
  }, [src, subtitleTracks]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle volume
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle seeking
  const handleSeek = (e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Skip functions
  const skipIntro = () => {
    const video = videoRef.current;
    if (!video || !introSkip) return;
    video.currentTime = introSkip.end;
    setShowSkipIntro(false);
  };

  const skipOutro = () => {
    const video = videoRef.current;
    if (!video || !outroSkip) return;
    video.currentTime = outroSkip.end;
    setShowSkipOutro(false);
  };

  // Skip forward/backward
  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
  };

  // Playback rate
  const changePlaybackRate = () => {
    const video = videoRef.current;
    if (!video) return;

    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // Caption selection
  const handleCaptionSelect = (label) => {
    console.log('Caption selected:', label);
    setSelectedCaption(label);
    setShowCaptionMenu(false);
  };

  const toggleCaptionMenu = () => {
    console.log('Toggling caption menu. Tracks available:', subtitleTracks.length);
    setShowCaptionMenu(!showCaptionMenu);
  };

  // Auto-hide controls
  const resetHideControlsTimeout = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCaptionMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
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
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
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
  }, [isPlaying, volume, showCaptionMenu]);

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
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        crossOrigin="anonymous"
        autoPlay={autoPlay}
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Skip Intro Button */}
      {showSkipIntro && !autoSkipIntro && (
        <button
          onClick={skipIntro}
          className="absolute bottom-28 right-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 z-20 flex items-center gap-2 border border-white/20"
        >
          <SkipForward className="h-4 w-4" />
          Skip Intro
        </button>
      )}

      {/* Skip Outro Button */}
      {showSkipOutro && (
        <button
          onClick={skipOutro}
          className="absolute bottom-28 right-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 z-20 flex items-center gap-2 border border-white/20"
        >
          <SkipForward className="h-4 w-4" />
          Skip Outro
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        } z-30`}
      >
        {/* Progress Bar */}
        <div className="px-4 py-2">
          <div
            ref={progressBarRef}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
            onClick={handleSeek}
          >
            {/* Buffered Progress */}
            <div
              className="absolute h-full bg-white/30 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Current Progress */}
            <div
              className="absolute h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between items-center mt-1 text-xs text-white/80 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2.5 hover:bg-white/10 rounded-lg transition"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" fill="white" />
              ) : (
                <Play className="h-6 w-6 text-white" fill="white" />
              )}
            </button>

            {/* Skip Backward */}
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-white/10 rounded-lg transition group/skip"
              title="Rewind 10s (←)"
            >
              <div className="relative">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v6l-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12a10 10 0 1 0 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">10</span>
              </div>
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Forward 10s (→)"
            >
              <div className="relative">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v6l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 12a10 10 0 1 1-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">10</span>
              </div>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Time Display (visible) */}
            <div className="hidden md:flex items-center text-sm text-white font-medium ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-white/60">/</span>
              <span className="text-white/80">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Skip Intro Button (in controls) */}
            {introSkip && currentTime >= introSkip.start - 5 && currentTime < introSkip.end && (
              <button
                onClick={skipIntro}
                className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 rounded-lg transition text-white text-sm font-semibold flex items-center gap-1.5"
                title="Skip Intro"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">Skip Intro</span>
              </button>
            )}

            {/* Skip Outro Button (in controls) */}
            {outroSkip && currentTime >= outroSkip.start - 5 && currentTime < outroSkip.end && (
              <button
                onClick={skipOutro}
                className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 rounded-lg transition text-white text-sm font-semibold flex items-center gap-1.5"
                title="Skip Outro"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">Skip Outro</span>
              </button>
            )}

            {/* Caption Button with Menu */}
            <div className="relative">
              <button
                onClick={toggleCaptionMenu}
                className={`p-2 rounded-lg transition ${
                  selectedCaption ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-white/10'
                }`}
                title="Captions (C)"
              >
                <Captions className="h-5 w-5 text-white" />
              </button>

              {/* Caption Menu */}
              {showCaptionMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl min-w-[200px] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-white font-semibold text-sm">Subtitles</span>
                    <button
                      onClick={() => setShowCaptionMenu(false)}
                      className="p-1 hover:bg-white/10 rounded transition"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Caption Options */}
                  <div className="py-2">
                    {/* Off Option */}
                    <button
                      onClick={() => handleCaptionSelect(null)}
                      className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/10 transition ${
                        selectedCaption === null ? 'bg-white/5' : ''
                      }`}
                    >
                      <span className="text-white text-sm">Off</span>
                      {selectedCaption === null && (
                        <Check className="h-4 w-4 text-purple-400" />
                      )}
                    </button>

                    {/* DEBUG: Show track count */}
                    {subtitleTracks.length === 0 && (
                      <div className="px-4 py-2 text-xs text-zinc-400 italic">
                        No subtitle tracks available
                      </div>
                    )}

                    {/* Subtitle Tracks */}
                    {subtitleTracks.map((track, index) => (
                      <button
                        key={index}
                        onClick={() => handleCaptionSelect(track.label)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/10 transition ${
                          selectedCaption === track.label ? 'bg-white/5' : ''
                        }`}
                      >
                        <span className="text-white text-sm">{track.label}</span>
                        {selectedCaption === track.label && (
                          <Check className="h-4 w-4 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Playback Speed */}
            <button
              onClick={changePlaybackRate}
              className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition text-white text-sm font-semibold"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Settings */}
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-white" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Fullscreen (F)"
            >
              <Maximize className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-20"
        >
          <div className="p-6 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition-all hover:scale-110">
            <Play className="h-16 w-16 text-white" fill="white" />
          </div>
        </button>
      )}
    </div>
  );
}