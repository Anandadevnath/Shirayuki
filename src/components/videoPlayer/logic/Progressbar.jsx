export function ProgressBar({ progressBarRef, currentTime, duration, buffered, onSeek }) {
  const {
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = onSeek;

  return (
    <div className="px-2 sm:px-6 pb-2">
      <div
        ref={progressBarRef}
        className="relative h-2 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-full cursor-pointer group/progress hover:h-2.5 transition-all backdrop-blur-sm"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Buffered Progress */}
        <div
          className="absolute h-full bg-gradient-to-r from-cyan-700/40 to-purple-700/40 rounded-full pointer-events-none"
          style={{ width: `${buffered}%` }}
        />
        
        {/* Current Progress */}
        <div
          className="absolute h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-cyan-500/50 pointer-events-none"
          style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl shadow-cyan-400/50 opacity-0 group-hover/progress:opacity-100 transition-opacity border-2 border-cyan-300" />
        </div>
      </div>
    </div>
  );
}