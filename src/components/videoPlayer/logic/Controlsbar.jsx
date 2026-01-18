import { VideoPlayerControls } from "../ui";

export function ControlsBar({
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
  changePlaybackRate,
  playbackRates,
  selectedCaption,
  toggleCaptionMenu,
  showCaptionMenu,
  handleCaptionSelect,
  subtitleTracks,
  toggleFullscreen,
}) {
  return (
    <VideoPlayerControls
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      skip={skip}
      isMuted={isMuted}
      toggleMute={toggleMute}
      volume={volume}
      handleVolumeChange={handleVolumeChange}
      currentTime={currentTime}
      duration={duration}
      formatTime={formatTime}
      playbackRate={playbackRate}
      changePlaybackRate={changePlaybackRate}
      playbackRates={playbackRates}
      selectedCaption={selectedCaption}
      toggleCaptionMenu={toggleCaptionMenu}
      showCaptionMenu={showCaptionMenu}
      handleCaptionSelect={handleCaptionSelect}
      subtitleTracks={subtitleTracks}
      toggleFullscreen={toggleFullscreen}
    />
  );
}