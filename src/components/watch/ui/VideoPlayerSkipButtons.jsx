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
          className="ml-2 px-3 py-1 rounded-full font-bold text-sm sm:text-base flex items-center gap-2 bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-50/20 hover:text-cyan-300 transition-all shadow-sm absolute right-3 sm:right-8 bottom-22 sm:bottom-26 z-20"
          style={{ fontWeight: 700, letterSpacing: 1, minWidth: 80, borderStyle: 'solid', borderWidth: 2, background: 'transparent' }}
          title={showSkipOutroEarly ? 'Skip Outro (Soon)' : 'Skip Outro'}
        >
          <SkipForward className="h-5 w-5" />
          <span className="uppercase tracking-wide">{showSkipOutroEarly ? 'Skip Outro (Soon)' : 'Skip Outro'}</span>
        </button>
      )}
      {(showSkipIntroEarly || (showSkipIntro && !autoSkipIntro)) && (
        <button
          onClick={skipIntro}
          className="ml-2 px-3 py-1 rounded-full font-bold text-sm sm:text-base flex items-center gap-2 bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-50/20 hover:text-cyan-300 transition-all shadow-sm absolute right-3 sm:right-8 bottom-22 sm:bottom-26 z-20"
          style={{ fontWeight: 700, letterSpacing: 1, minWidth: 80, borderStyle: 'solid', borderWidth: 2, background: 'transparent' }}
          title={showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}
        >
          <SkipForward className="h-5 w-5" />
          <span className="uppercase tracking-wide">{showSkipIntroEarly ? 'Skip Intro (Soon)' : 'Skip Intro'}</span>
        </button>
      )}
    </>
  );
}
