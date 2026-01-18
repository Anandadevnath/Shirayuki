import { useEffect } from "react";

export function useSubtitleTracks(videoRef, selectedCaption, subtitleTracks, src) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setTracks = () => {
      const tracks = video.textTracks;
      if (tracks.length === 0) return;

      Array.from(tracks).forEach(track => track.mode = 'disabled');

      if (selectedCaption !== null) {
        const trackIndex = subtitleTracks.findIndex(t => t.label === selectedCaption);
        if (trackIndex !== -1 && tracks[trackIndex]) {
          tracks[trackIndex].mode = 'showing';
        }
      }
    };

    if (video.textTracks.length === 0) {
      const timer = setTimeout(setTracks, 100);
      return () => clearTimeout(timer);
    } else {
      setTracks();
    }
  }, [videoRef, selectedCaption, subtitleTracks, src]);
}