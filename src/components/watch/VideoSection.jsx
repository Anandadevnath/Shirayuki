import { RotateCcw } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

/**
 * Video display section with loading and error states
 * Shows VideoPlayer when URL is available, loading spinner or retry button otherwise
 */
const VideoSection = ({
  streamingUrl,
  serverLoading,
  handleReloadVideo,
  selectedServer,
  videoPlayerProps,
}) => {
  const hasVideo = (streamingUrl || videoPlayerProps?.embedUrl) && !serverLoading;

  if (hasVideo) {
    return (
      <div className="aspect-video bg-black/50 backdrop-blur-sm relative">
        <VideoPlayer key={videoPlayerProps?.embedUrl || streamingUrl} {...videoPlayerProps} />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black/50 backdrop-blur-sm relative flex flex-col items-center justify-center">
      {serverLoading ? (
        <>
          <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4">
            <RotateCcw className="h-12 w-12 text-purple-400 animate-spin" />
          </div>
          <p className="text-zinc-300 text-lg">Loading...</p>
        </>
      ) : (
        <>
          <button
            onClick={handleReloadVideo}
            disabled={!selectedServer}
            className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-xl mb-4 hover:bg-purple-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reload video"
          >
            <RotateCcw className="h-12 w-12 text-purple-400" />
          </button>
          <p className="text-zinc-300 text-lg">
            Video failed to load. Click to retry.
          </p>
        </>
      )}
    </div>
  );
};

export default VideoSection;
