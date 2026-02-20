import { useEffect, useRef, memo } from "react";
import Hls from "hls.js";

const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
};

const SUBTITLE_STYLE = `
  video::cue {
    background: none !important;
    color: white;
    text-shadow: 2px 2px 4px #000, 0 0 2px #000;
    font-size: 1em;
  }
`;

const isHLSSource = (src) => src.includes("m3u8");

export const VideoElement = memo(function VideoElement({
  videoRef,
  src,
  subtitleTracks,
  autoPlay,
  togglePlay,
}) {
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    const destroyHls = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    destroyHls();

    if (!isHLSSource(src)) {
      video.src = src;
      return destroyHls;
    }

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          destroyHls();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return destroyHls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, autoPlay]); 

  return (
    <>
      <style>{SUBTITLE_STYLE}</style>
      <video
        ref={videoRef}
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
            src={track.file || track.url}
            srcLang={
              (track.lang || track.label || "en").toLowerCase().slice(0, 2)
            }
            label={track.label || track.lang}
            default={track.default || index === 0}
          />
        ))}
      </video>
    </>
  );
});