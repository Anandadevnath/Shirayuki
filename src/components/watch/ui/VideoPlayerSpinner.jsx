import { Loader2 } from "lucide-react";

export default function VideoPlayerSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        </div>
      </div>
    </div>
  );
}
