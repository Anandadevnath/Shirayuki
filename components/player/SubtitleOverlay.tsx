"use client";

import { useEffect, useRef, useState } from "react";
import { parseVtt, findCue, type VttCue } from "@/lib/subtitle/vtt";

interface SubtitleOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string | null;
  visible: boolean;
  /**
   * Whether the player chrome (scrubber + buttons) is currently visible.
   * When true, the overlay lifts higher to keep the cue out of the
   * control strip. Mirrors the `showUI` state from Player.tsx.
   */
  controlsVisible?: boolean;
}

/**
 * Custom subtitle overlay. Replaces the browser's default <track> rendering
 * because WebKit/Blink paints a default black background on `::cue` that
 * `background: transparent` cannot override. We fetch the VTT, parse it,
 * and render the active cue as a React node — so we have full control over
 * the typography and there is no opaque wrapper behind the text.
 *
 * Positioning model (anime-streaming convention, matches Netflix/Crunchyroll):
 *   - anchored with `bottom: <pct>%` so it scales with player height
 *   - lifts upward when controls are visible (clears scrubber + button row)
 *   - safe-area aware on mobile (notch / home-indicator inset)
 *
 * Typography:
 *   - 1.35rem (≈ 21.6px) at desktop, 1.5rem on mobile — large enough to
 *     read at typical viewing distance without overwhelming the frame
 *   - layered text-shadow for legibility on any frame; no opaque wrapper
 *   - max-width clamped at 80% of player width so multi-line dialogue wraps
 *     naturally without stretching edge-to-edge
 */
export function SubtitleOverlay({
  videoRef,
  src,
  visible,
  controlsVisible = false,
}: SubtitleOverlayProps) {
  const [cues, setCues] = useState<VttCue[]>([]);
  const [active, setActive] = useState<VttCue | null>(null);

  // Load + parse the VTT when src changes.
  useEffect(() => {
    if (!src) {
      setCues([]);
      setActive(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const text = await res.text();
        if (cancelled) return;
        setCues(parseVtt(text));
      } catch {
        // swallow — overlay stays empty, no console noise
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Sync active cue to playhead via requestAnimationFrame, not timeupdate
  // (timeupdate fires ~4Hz, which causes visible lag on subtitle cuts).
  useEffect(() => {
    if (!visible || !cues.length) {
      setActive(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const cue = findCue(cues, v.currentTime);
        setActive((prev) => (prev === cue ? prev : cue));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, cues, videoRef]);

  if (!visible || !active) return null;

  // Anime-player positioning: cue sits very close to the bottom edge —
  // matches MPV / VLC / fansub release convention. The default `bottom`
  // is a small fixed offset above the control bar; when controls appear
  // (hover), the cue slides up just enough to clear the scrubber.
  //
  //   controls hidden → ~32px above bottom (tight to frame)
  //   controls visible → ~96px above bottom (clears scrubber + buttons)
  const bottomOffset = controlsVisible ? 96 : 32;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4 transition-[bottom] duration-200 ease-out"
      style={{
        bottom: `${bottomOffset}px`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-hidden="true"
    >
      <div
        className="text-center font-sans leading-snug text-white"
        style={{
          maxWidth: "80%",
          fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
          fontWeight: 500,
          letterSpacing: "0.005em",
          textShadow:
            "0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
          whiteSpace: "pre-wrap",
        }}
      >
        {active.text}
      </div>
    </div>
  );
}
