import { SkipForward } from "lucide-react";

export default function VideoPlayerSkipButtons({
  showSkipIntroEarly,
  showSkipIntro,
  autoSkipIntro,
  skipIntro,
  showSkipOutroEarly,
  showSkipOutro,
  skipOutro,
}) {
  return (
    <>
      {(showSkipOutroEarly || showSkipOutro) && (
        <button
          onClick={skipOutro}
          className={`absolute bottom-32 right-8 font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 z-20 flex items-center gap-3 shadow-2xl backdrop-blur-xl border-2
            ${showSkipOutroEarly
              ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-purple-400/50 text-white shadow-purple-500/50'
              : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 border-purple-300/50 text-white shadow-purple-400/60 hover:from-purple-400 hover:to-pink-400'}`}
        >
          <SkipForward className="h-6 w-6" />
          <span className="text-lg font-extrabold tracking-wide">SKIP OUTRO</span>
        </button>
      )}
      {(showSkipIntroEarly || (showSkipIntro && !autoSkipIntro)) && (
        <button
          onClick={skipIntro}
          className="ml-2 px-4 py-1.5 rounded-full font-bold text-base flex items-center gap-2 bg-transparent text-cyan-600 border-2 border-cyan-400 hover:bg-cyan-50/20 hover:text-cyan-400 transition-all shadow-sm absolute right-8 bottom-32"
          style={{ fontWeight: 700, letterSpacing: 1, minWidth: 110, borderStyle: 'solid', borderWidth: 2, background: 'transparent' }}
          title={showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}
        >
          <SkipForward className="h-5 w-5" />
          <span className="uppercase tracking-wide">{showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}</span>
        </button>
      )}
    </>
  );
}
