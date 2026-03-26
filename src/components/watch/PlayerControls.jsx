import { SkipForward, SkipBack, Plus, Captions } from "lucide-react";
import IconBtn from "@/components/ui/IconBtn";

/**
 * Player bottom bar with episode navigation, auto-skip toggle, and metadata
 */
const PlayerControls = ({
  goPrev,
  goNext,
  currentEpisodeIndex,
  episodesLength,
  autoSkipIntro,
  toggleAutoSkip,
  currentEpisode,
  subtitleTracks,
}) => (
  <div className="flex flex-col gap-3 px-6 py-4 bg-black/30 backdrop-blur-xl border-t border-white/10">
    {/* Top Row: Navigation and Auto-Skip */}
    <div className="flex items-center justify-between">
      <div className="flex gap-2 items-center">
        <IconBtn
          onClick={goPrev}
          icon={<SkipBack className="h-5 w-5" />}
          disabled={currentEpisodeIndex === 0}
        />
        <IconBtn
          onClick={goNext}
          icon={<SkipForward className="h-5 w-5" />}
          disabled={currentEpisodeIndex === episodesLength - 1}
        />
        <button
          onClick={toggleAutoSkip}
          title={
            autoSkipIntro ? "Auto-Skip Intro: ON" : "Auto-Skip Intro: OFF"
          }
          className={`ml-2 px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center border-2 focus:outline-none font-bold text-sm uppercase tracking-wide ${
            autoSkipIntro
              ? "bg-purple-600/80 border-purple-400 text-white shadow shadow-purple-500/30"
              : "bg-white/5 border-zinc-700 text-purple-200 hover:bg-purple-700/20"
          }`}
          style={{ minWidth: 40, minHeight: 40 }}
        >
          AutoSkip
        </button>
      </div>
      <div className="flex gap-2">
        <IconBtn icon={<Plus className="h-5 w-5" />} tooltip="Add to List" />
      </div>
    </div>

    {/* Bottom Row: Episode Info */}
    {currentEpisode && (
      <div className="px-2 pt-2 border-t border-white/10">
        <h3 className="text-white text-lg font-bold tracking-wide">
          Episode {currentEpisode.number}
        </h3>
        {currentEpisode.title && (
          <p className="text-purple-300 text-sm font-medium mt-1">
            {currentEpisode.title}
          </p>
        )}
        {subtitleTracks.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Captions className="h-4 w-4 text-purple-400" />
            <p className="text-xs text-zinc-400">
              Subtitles: {subtitleTracks.map((t) => t.label).join(", ")}
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);

export default PlayerControls;
