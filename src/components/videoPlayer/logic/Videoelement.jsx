export function VideoElement({ videoRef, src, subtitleTracks, autoPlay, togglePlay }) {
  return (
    <>
      <style>{`
        video::cue {
          background: none !important;
          color: white;
          text-shadow: 2px 2px 4px #000, 0 0 2px #000;
          font-size: 1em;
        }
      `}</style>

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
    </>
  );
}