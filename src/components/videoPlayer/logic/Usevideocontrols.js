import { useState, useCallback, useMemo, useRef } from "react";

export function useVideoControls(videoRef, progressBarRef, videoState, options) {
  const { introSkip, outroSkip, autoSkipIntro } = options;
  const isDraggingRef = useRef(false);

  const [showCaptionMenu, setShowCaptionMenu] = useState(false);

  const playbackRates = useMemo(() => [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], []);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoState.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    videoState.setIsPlaying(!videoState.isPlaying);
  }, [videoState, videoRef]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !videoState.isMuted;
    videoState.setIsMuted(!videoState.isMuted);
  }, [videoState, videoRef]);

  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    videoState.setVolume(newVolume);
    videoState.setIsMuted(newVolume === 0);
  }, [videoState, videoRef]);

  const calculateSeekPosition = useCallback((clientX) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return null;

    const rect = progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * video.duration;
  }, [progressBarRef, videoRef]);

  const updateVideoTime = useCallback((clientX) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = calculateSeekPosition(clientX);
    if (newTime !== null) {
      video.currentTime = newTime;
      videoState.setCurrentTime(newTime);
    }
  }, [calculateSeekPosition, videoState, videoRef]);

  const handleProgressBarInteraction = useMemo(() => ({
    handleMouseDown: (e) => {
      isDraggingRef.current = true;
      updateVideoTime(e.clientX);
    },
    handleMouseMove: (e) => {
      if (!isDraggingRef.current) return;
      updateVideoTime(e.clientX);
    },
    handleMouseUp: () => {
      isDraggingRef.current = false;
    },
    handleTouchStart: (e) => {
      if (e.touches.length > 0) {
        isDraggingRef.current = true;
        updateVideoTime(e.touches[0].clientX);
      }
    },
    handleTouchMove: (e) => {
      if (!isDraggingRef.current || e.touches.length === 0) return;
      updateVideoTime(e.touches[0].clientX);
    },
    handleTouchEnd: () => {
      isDraggingRef.current = false;
    },
    isDraggingRef,
  }), [updateVideoTime]);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [videoRef]);

  const skipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video || !introSkip) return;
    video.currentTime = introSkip.end;
    videoState.setShowSkipIntro(false);
    videoState.setShowSkipIntroEarly(false);
  }, [introSkip, videoState, videoRef]);

  const skipOutro = useCallback(() => {
    const video = videoRef.current;
    if (!video || !outroSkip) return;
    video.currentTime = outroSkip.end;
    videoState.setShowSkipOutro(false);
    videoState.setShowSkipOutroEarly(false);
  }, [outroSkip, videoState, videoRef]);

  const skip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
  }, [videoRef]);

  const changePlaybackRate = useCallback((rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    videoState.setPlaybackRate(rate);
  }, [videoState, videoRef]);

  const handleCaptionSelect = useCallback((label) => {
    videoState.setSelectedCaption(label);
    setShowCaptionMenu(false);
  }, [videoState]);

  const toggleCaptionMenu = useCallback(() => {
    setShowCaptionMenu(prev => !prev);
  }, []);

  const updateSkipButtonStates = useCallback((time) => {
    if (introSkip) {
      const { start, end } = introSkip;
      const showEarly = 5;

      if (time >= start - showEarly && time < start) {
        videoState.setShowSkipIntroEarly(true);
        videoState.setShowSkipIntro(false);
      } else if (time >= start && time < end) {
        videoState.setShowSkipIntroEarly(false);
        videoState.setShowSkipIntro(true);
        if (autoSkipIntro && videoRef.current) {
          videoRef.current.currentTime = end;
          videoState.setShowSkipIntro(false);
        }
      } else if (videoState.showSkipIntro || videoState.showSkipIntroEarly) {
        videoState.setShowSkipIntroEarly(false);
        videoState.setShowSkipIntro(false);
      }
    }

    if (outroSkip) {
      const { start, end } = outroSkip;
      const showEarly = 5;

      if (time >= start - showEarly && time < start) {
        videoState.setShowSkipOutroEarly(true);
        videoState.setShowSkipOutro(false);
      } else if (time >= start && time < end) {
        videoState.setShowSkipOutroEarly(false);
        videoState.setShowSkipOutro(true);
      } else if (videoState.showSkipOutro || videoState.showSkipOutroEarly) {
        videoState.setShowSkipOutroEarly(false);
        videoState.setShowSkipOutro(false);
      }
    }
  }, [introSkip, outroSkip, autoSkipIntro, videoState, videoRef]);

  return {
    formatTime,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleProgressBarInteraction,
    toggleFullscreen,
    skipIntro,
    skipOutro,
    skip,
    changePlaybackRate,
    handleCaptionSelect,
    toggleCaptionMenu,
    showCaptionMenu,
    setShowCaptionMenu,
    playbackRates,
    updateSkipButtonStates,
  };
}