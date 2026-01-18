import { useState, useMemo, useRef, useEffect } from "react";

export function useVideoState(src, autoPlay, subtitleTracks) {
  const lastSrcRef = useRef(null);
  const resetStateTimeoutRef = useRef(null);

  const defaultCaption = useMemo(() => {
    const defaultTrack = subtitleTracks.find(t => t.default);
    return defaultTrack ? defaultTrack.label : null;
  }, [subtitleTracks]);

  // State
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [showSkipIntroEarly, setShowSkipIntroEarly] = useState(false);
  const [showSkipOutroEarly, setShowSkipOutroEarly] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedCaption, setSelectedCaption] = useState(defaultCaption);

  // Reset state when src changes
  useEffect(() => {
    if (lastSrcRef.current !== src) {
      lastSrcRef.current = src;

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
      }
    };
  }, [src, defaultCaption]);

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    buffered,
    setBuffered,
    isLoading,
    setIsLoading,
    showSkipIntro,
    setShowSkipIntro,
    showSkipOutro,
    setShowSkipOutro,
    showSkipIntroEarly,
    setShowSkipIntroEarly,
    showSkipOutroEarly,
    setShowSkipOutroEarly,
    playbackRate,
    setPlaybackRate,
    selectedCaption,
    setSelectedCaption,
  };
}