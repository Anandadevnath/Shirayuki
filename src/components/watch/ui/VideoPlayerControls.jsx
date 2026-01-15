import { Maximize, Settings, Check, Captions, RotateCcw, RotateCw, Volume2, VolumeX, Pause, Play } from "lucide-react";
import React from "react";

export default function VideoPlayerControls({
  isPlaying,
  togglePlay,
  skip,
  isMuted,
  toggleMute,
  volume,
  handleVolumeChange,
  currentTime,
  duration,
  formatTime,
  playbackRate,
  toggleSettingsMenu,
  showSettingsMenu,
  changePlaybackRate,
  playbackRates,
  showSkipIntroEarly,
  showSkipIntro,
  autoSkipIntro,
  skipIntro,
  selectedCaption,
  toggleCaptionMenu,
  showCaptionMenu,
  handleCaptionSelect,
  subtitleTracks,
  toggleFullscreen,
}) {
  return (
    <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 pb-3 w-full overflow-x-auto scrollbar-none" style={{ flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', minHeight: 48 }}>
      {/* Left Side */}
      <div className="flex items-center gap-1">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-2 sm:p-3 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 group/btn backdrop-blur-sm"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
          ) : (
            <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
          )}
        </button>
        {/* Skip Backward */}
        <button
          onClick={() => skip(-10)}
          className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
          title="Rewind 10s"
        >
          <RotateCcw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
        </button>
        {/* Skip Forward */}
        <button
          onClick={() => skip(10)}
          className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
          title="Forward 10s"
        >
          <RotateCw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
        </button>
        {/* Volume */}
        <div className="flex items-center gap-1 ml-1 group/volume">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all backdrop-blur-sm"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
            ) : (
              <Volume2 className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-0 group-hover/volume:w-24 transition-all duration-300 h-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-full appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-purple-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50"
          />
        </div>
        {/* Time Display */}
        <div className="hidden md:flex items-center text-sm font-mono text-white/90 ml-3 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="text-cyan-300 font-bold">{formatTime(currentTime)}</span>
          <span className="mx-2 text-white/40">/</span>
          <span className="text-white/70">{formatTime(duration)}</span>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex items-center gap-1">
        {/* Playback Speed */}
        <div className="relative">
          <button
            onClick={toggleSettingsMenu}
            className={`px-4 py-2 rounded-xl transition-all backdrop-blur-sm font-mono font-bold text-sm ${showSettingsMenu ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300' : 'hover:bg-cyan-500/20 text-white/90 hover:text-cyan-300'}`}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
          {showSettingsMenu && (
            <div className="absolute bottom-full right-0 mb-3 bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 min-w-[180px] overflow-hidden">
              <div className="px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-purple-900/20">
                <span className="text-white font-bold text-sm tracking-wide">PLAYBACK SPEED</span>
              </div>
              <div className="py-2">
                {playbackRates.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 transition-all ${playbackRate === rate ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' : ''}`}
                  >
                    <span className={`font-mono font-bold text-sm ${playbackRate === rate ? 'text-cyan-300' : 'text-white/80'}`}>{rate}x</span>
                    {playbackRate === rate && <Check className="h-4 w-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Captions */}
        <div className="relative">
          <button
            onClick={toggleCaptionMenu}
            className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${selectedCaption ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300' : 'hover:bg-cyan-500/20 text-white hover:text-cyan-300'}`}
            title="Captions"
          >
            <Captions className="h-5 w-5" />
          </button>
          {showCaptionMenu && (
            <div className="absolute bottom-full right-0 mb-3 bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 min-w-[220px] overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <span className="text-white font-bold text-sm tracking-wide">SUBTITLES</span>
              </div>
              <div className="py-2">
                <button
                  onClick={() => handleCaptionSelect(null)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all ${selectedCaption === null ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' : ''}`}
                >
                  <span className={`text-sm font-semibold ${selectedCaption === null ? 'text-purple-300' : 'text-white/80'}`}>Off</span>
                  {selectedCaption === null && <Check className="h-4 w-4 text-purple-400" />}
                </button>
                {subtitleTracks.map((track, index) => (
                  <button
                    key={index}
                    onClick={() => handleCaptionSelect(track.label)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all ${selectedCaption === track.label ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' : ''}`}
                  >
                    <span className={`text-sm font-semibold ${selectedCaption === track.label ? 'text-purple-300' : 'text-white/80'}`}>{track.label}</span>
                    {selectedCaption === track.label && <Check className="h-4 w-4 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm ml-1"
          title="Fullscreen"
        >
          <Maximize className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
        </button>
      </div>
    </div>
  );
}
