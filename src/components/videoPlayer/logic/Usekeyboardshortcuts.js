import { useEffect } from "react";

export function useKeyboardShortcuts(
  videoRef,
  togglePlay,
  skip,
  toggleMute,
  toggleFullscreen,
  toggleCaptionMenu
) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;

      const keyActions = {
        " ": togglePlay,
        "k": togglePlay,
        "ArrowLeft": () => skip(-10),
        "ArrowRight": () => skip(10),
        "m": toggleMute,
        "f": toggleFullscreen,
        "c": toggleCaptionMenu,
      };

      const action = keyActions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [videoRef, togglePlay, skip, toggleMute, toggleFullscreen, toggleCaptionMenu]);
}