import { useEffect, useRef } from "react";

export function useVideoEventHandlers(videoRef, videoState, videoControls, onEnded) {
  const tracksInitializedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      videoState.setDuration(video.duration);
      videoState.setIsLoading(false);

      if (!tracksInitializedRef.current && video.textTracks.length > 0) {
        tracksInitializedRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      if (videoControls.handleProgressBarInteraction.isDraggingRef.current) return;
      
      const time = video.currentTime;
      videoState.setCurrentTime(time);
      videoControls.updateSkipButtonStates(time);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        videoState.setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleWaiting = () => videoState.setIsLoading(true);
    const handleCanPlay = () => videoState.setIsLoading(false);
    const handleEnded = () => {
      videoState.setIsPlaying(false);
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
  }, [videoRef, videoState, videoControls, onEnded]);

  // Global mouse/touch event handlers for seeking
  useEffect(() => {
    const { handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isDraggingRef } = 
      videoControls.handleProgressBarInteraction;

    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleMouseMove(e);
      }
    };
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleMouseUp();
      }
    };
    const handleGlobalTouchMove = (e) => {
      if (isDraggingRef.current) {
        handleTouchMove(e);
      }
    };
    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        handleTouchEnd();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [videoControls.handleProgressBarInteraction]);
}