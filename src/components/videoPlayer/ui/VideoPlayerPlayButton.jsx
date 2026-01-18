import { Play } from "lucide-react";

export default function VideoPlayerPlayButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 flex items-center justify-center z-20 group/play"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
        <div className="absolute left-1/2 top-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-xl opacity-50 group-hover/play:opacity-70 transition-opacity" style={{ width: 60, height: 60, transform: 'translate(-50%, -50%)' }}></div>
        <div className="relative flex items-center justify-center p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl rounded-full hover:from-cyan-500/30 hover:to-purple-500/30 transition-all hover:scale-110 border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/30" style={{ width: 60, height: 60 }}>
          <Play className="h-8 w-8 text-white" fill="white" />
        </div>
      </div>
    </button>
  );
}
