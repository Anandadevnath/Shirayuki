import { useState, useCallback, useRef, useEffect } from "react";

export function useControlsVisibility(isPlaying, showCaptionMenu) {
  const hideControlsTimeoutRef = useRef(null);
  const showControlsSyncTimeoutRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);

  const [showControls, setShowControls] = useState(true);

  const clearAllTimeouts = useCallback(() => {
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    if (showControlsSyncTimeoutRef.current) clearTimeout(showControlsSyncTimeoutRef.current);
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
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    
    if (!isPlaying) {
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
      }
      showControlsSyncTimeoutRef.current = setTimeout(() => {
        setShowControls(true);
        showControlsSyncTimeoutRef.current = null;
      }, 0);

      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    } else {
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
        showControlsSyncTimeoutRef.current = null;
      }
    }

    return () => {
      if (showControlsSyncTimeoutRef.current) {
        clearTimeout(showControlsSyncTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  return {
    showControls,
    setShowControls,
    resetHideControlsTimeout,
  };
}