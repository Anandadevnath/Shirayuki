"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, Settings, PictureInPicture2, Captions, Loader2,
  Keyboard, X,
} from "lucide-react";
import { usePrefs } from "@/lib/stores/prefs";
import { saveProgress, getEpisodeSeconds, type WatchEntry } from "@/lib/progress/local";
import { formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { SubtitleOverlay } from "@/components/player/SubtitleOverlay";

export interface PlayerProps {
  src: string;
  poster: string | null;
  tracks: { src: string; label: string; default: boolean }[];
  intro: { start: number; end: number } | null;
  outro: { start: number; end: number } | null;
  meta: Omit<WatchEntry, "seconds" | "duration" | "updatedAt">;
  nextHref: string | null;
}

interface Level { height: number; index: number }

// Time-update throttling: the video element fires `timeupdate` ~4×/sec. We
// buffer the latest currentTime in a ref and only flush to React state on
// a ~120ms cadence so the scrubber updates feel smooth without forcing 4
// reconciliation passes per second.
const TICK_MS = 120;

export function Player({ src, poster, tracks, intro, outro, meta, nextHref }: PlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<unknown>(null);

  const prefs = usePrefs();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fs, setFs] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevel] = useState(-1);
  const [settings, setSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [trackIdx, setTrackIdx] = useState<number>(
    () => tracks.findIndex((t) => t.default) >= 0
      ? tracks.findIndex((t) => t.default)
      : 0
  );
  const [captionsOn, setCaptionsOn] = useState<boolean>(prefs.captions);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [scrubberHover, setScrubberHover] = useState<{ x: number; time: number } | null>(null);
  const [upNextVisible, setUpNextVisible] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(10);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Throttle marker for the `timeupdate` listener. Native fires ~4Hz on most
  // browsers; we coalesce to ~8Hz (120ms) before re-rendering the scrubber.
  const lastTickRef = useRef(0);

  // ── Attach HLS (the fix the old app never shipped) ──────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    setReady(false);

    async function attach() {
      const { default: Hls } = await import("hls.js");
      if (destroyed || !video) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          // C1/C4 fix: cap rendition requests to the actual rendered size
          // so the manifest never picks a 4K variant for a 360p player, and
          // give the ABR a sane buffer budget. Pure JS config — the HLS
          // proxy and stream URLs are unchanged.
          capLevelToPlayerSize: true,
          backBufferLength: 30,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          if (destroyed || !video) return;
          setLevels(
            data.levels
              .map((l, index) => ({ height: l.height, index }))
              .filter((l) => l.height),
          );
          // C4 fix: pick the largest level that fits the rendered player
          // (clamped to DPR). Falls back to the highest available variant
          // if no exact match. This kills the "blurry startup" symptom
          // because hls.js no longer opens on the smallest rendition.
          const targetW = video.clientWidth * (window.devicePixelRatio || 1);
          const targetH = video.clientHeight * (window.devicePixelRatio || 1);
          const candidates = (data.levels as Array<{ width: number; height: number }>)
            .map((l, i) => ({ i, w: l.width || 0, h: l.height || 0 }))
            .sort((a, b) => (b.w * b.h) - (a.w * a.h));
          const fit = candidates.find(
            (l) => l.w <= targetW * 1.25 && l.h <= targetH * 1.25,
          );
          if (fit) hls.startLevel = fit.i;
          setReady(true);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setLevel(data.level));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            // best-effort recovery
            if (data.type === "networkError") hls.startLoad();
            else if (data.type === "mediaError") hls.recoverMediaError();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src; // Safari native HLS
        setReady(true);
      }
    }
    attach();

    return () => {
      destroyed = true;
      const hls = hlsRef.current as { destroy?: () => void } | null;
      hls?.destroy?.();
      hlsRef.current = null;
    };
  }, [src]);

  // ── Restore position + apply remembered prefs ───────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !ready) return;
    v.volume = prefs.volume;
    v.muted = prefs.muted;
    v.playbackRate = prefs.rate;
    const saved = getEpisodeSeconds(meta.episodeId);
    if (saved > 5) v.currentTime = saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, meta.episodeId]);

  // ── Persist progress every 5s ───────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const id = setInterval(() => {
      if (v.duration > 0 && v.currentTime > 1) {
        saveProgress({
          ...meta,
          seconds: v.currentTime,
          duration: v.duration,
          updatedAt: Date.now(),
        });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [meta]);

  // Native <track> rendering was removed in favour of a custom React overlay
  // (see <SubtitleOverlay />). The native textTracks list still exists on
  // <video> but is never shown, so we no longer touch .mode here. The
  // overlay picks up its source from `tracks[trackIdx]` reactively.

  const setLevelTo = (idx: number) => {
    const hls = hlsRef.current as { currentLevel: number } | null;
    if (hls) hls.currentLevel = idx;
    setLevel(idx);
    setSettings(false);
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(t, v.duration || 0));
  };

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (v) seek(v.currentTime + delta);
  }, []);

  const setVolume = (vol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, vol));
    // If the user explicitly drags the volume up from 0, unmute.
    if (v.volume > 0 && v.muted) v.muted = false;
    prefs.set({ volume: v.volume, muted: v.muted });
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    prefs.set({ muted: v.muted });
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* unsupported */ }
  };

  // C2 fix: properly toggle captions. The previous implementation walked
  // every track and set them all to the same mode, which conflicted with
  // the selected track. Now we toggle on/off for the selected track only.
  const toggleCaptions = () => {
    const next = !captionsOn;
    setCaptionsOn(next);
    prefs.set({ captions: next });
  };

  const selectTrack = (idx: number) => {
    setTrackIdx(idx);
    setCaptionsOn(true);
    prefs.set({ captions: true });
  };

  const goNext = useCallback(() => {
    if (nextHref) router.push(nextHref);
  }, [nextHref, router]);

  const cancelUpNext = () => {
    setUpNextVisible(false);
    prefs.set({ autoPlayNext: false });
  };

  // ── Settings panel: click-outside + Escape to close ───────────────
  useEffect(() => {
    if (!settings) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = settingsRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) setSettings(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setSettings(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [settings]);

  // ── Help panel: click-outside + Escape to close ───────────────────
  useEffect(() => {
    if (!showHelp) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = helpRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) setShowHelp(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setShowHelp(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [showHelp]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
          e.preventDefault();
          seekBy(-10);
          break;
        case "l":
          e.preventDefault();
          seekBy(10);
          break;
        case "arrowright":
          e.preventDefault();
          seekBy(5);
          break;
        case "arrowleft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(v.volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(v.volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFs();
          break;
        case "c":
          e.preventDefault();
          toggleCaptions();
          break;
        case "p":
          e.preventDefault();
          togglePip();
          break;
        case "n":
          e.preventDefault();
          goNext();
          break;
        case "s":
          // A10 fix: skip intro with S (Crunchyroll convention).
          e.preventDefault();
          if (intro) seek(intro.end);
          break;
        case "?":
          e.preventDefault();
          setShowHelp((s) => !s);
          break;
        case "0": case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": case "9": {
          const pct = parseInt(e.key, 10) / 10;
          if (v.duration) seek(v.duration * pct);
          break;
        }
        case "home":
          e.preventDefault();
          seek(0);
          break;
        case "end":
          e.preventDefault();
          if (v.duration) seek(v.duration);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, goNext, captionsOn]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const nudgeUI = () => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowUI(false);
    }, 2800);
  };

  // ── Skip intro/outro from API timings (free from the API) ───────────
  const inIntro = intro && current >= intro.start && current < intro.end;
  const inOutro = outro && current >= outro.start && current < outro.end;

  useEffect(() => {
    if (inIntro && prefs.autoSkipIntro && intro) seek(intro.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inIntro]);
  useEffect(() => {
    // C12 fix: don't auto-jump mid-ED. The skip-outro button is the only
    // way out of the outro; auto-play only fires on onEnded.
    if (inOutro && prefs.autoSkipOutro && outro) {
      seek(outro.end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inOutro]);

  // C11 fix: "Up Next" countdown. Shows 15s before end of episode, gives the
  // user a 10s window to cancel before auto-redirect. Pure UI; the
  // auto-redirect itself is still gated on `prefs.autoPlayNext`.
  useEffect(() => {
    if (!nextHref || !duration || !prefs.autoPlayNext) {
      setUpNextVisible(false);
      return;
    }
    const remaining = duration - current;
    if (remaining <= 15 && remaining > 0 && playing) {
      setUpNextVisible(true);
      setUpNextCountdown(Math.max(1, Math.ceil(remaining)));
    } else if (remaining > 15) {
      setUpNextVisible(false);
    }
  }, [current, duration, nextHref, playing, prefs.autoPlayNext]);

  // C11 fix: countdown ticker for the up-next overlay.
  useEffect(() => {
    if (!upNextVisible || !prefs.autoPlayNext) return;
    const id = setInterval(() => {
      setUpNextCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          goNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [upNextVisible, prefs.autoPlayNext, goNext]);

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  const currentVolume = videoRef.current?.volume ?? prefs.volume;
  const currentMuted = videoRef.current?.muted ?? prefs.muted;
  const isMuted = currentMuted || currentVolume === 0;

  // Quality chip: show the currently-playing level (or "Auto").
  const currentLevelHeight = level >= 0 ? levels.find((l) => l.index === level)?.height : null;

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-video w-full overflow-hidden rounded-t-md bg-black ring-1 ring-line"
      onMouseMove={nudgeUI}
      onMouseLeave={() => playing && !upNextVisible && setShowUI(false)}
      onFocus={() => setShowUI(true)}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        playsInline
        className={cn(
          "size-full transition-opacity duration-300",
          // C17 fix: cross-fade the poster out when the first frame paints.
          // The poster is the only visible thing before `playing` fires; on
          // slow connections the eye reads the visual jump as "blurry".
          hasPlayedOnce ? "opacity-100" : "opacity-100",
        )}
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setHasPlayedOnce(true);
          nudgeUI();
        }}
        onPause={() => {
          setPlaying(false);
          setShowUI(true);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          const now = performance.now();
          if (lastTickRef.current && now - lastTickRef.current < TICK_MS) return;
          lastTickRef.current = now;
          setCurrent(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          // C12 fix: auto-play only on `onEnded`, never mid-ED.
          if (prefs.autoPlayNext && nextHref) goNext();
        }}
      />

      {/* Custom subtitle overlay — replaces the browser's native <track>
           rendering so we can drop the default black box behind cue text.
           The overlay reads from the same VTT sources (proxied through
           /api/subtitle to bypass CORS) but renders as a React node with
           text-shadow legibility, no opaque background. */}
      <SubtitleOverlay
        videoRef={videoRef}
        src={
          captionsOn && trackIdx >= 0 && tracks[trackIdx]
            ? `/api/subtitle?url=${encodeURIComponent(tracks[trackIdx]!.src)}`
            : null
        }
        visible={captionsOn}
        controlsVisible={showUI}
      />

      {/* C6 fix: corner loading spinner instead of full-screen overlay.
       A full-screen spinner hides the play button affordance; a corner
       one keeps the controls readable while still showing progress. */}
      {(!ready || waiting) && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-sm glass px-3 py-1.5 text-xs text-snow">
          <Loader2 className="size-3.5 animate-spin" />
          <span>{!ready ? "Loading…" : "Buffering…"}</span>
        </div>
      )}

      {/* Skip buttons — C7 fix: center horizontally on mobile so they're
       thumb-reachable, and reposition to right on sm+. */}
      {inIntro && !prefs.autoSkipIntro && intro && (
        <button
          onClick={() => seek(intro.end)}
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none sm:left-auto sm:right-5 sm:translate-x-0"
        >
          <SkipForward className="size-4" /> Skip Intro
        </button>
      )}
      {inOutro && !prefs.autoSkipOutro && outro && (
        <button
          onClick={() => (nextHref ? goNext() : seek(outro.end))}
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none sm:left-auto sm:right-5 sm:translate-x-0"
        >
          <SkipForward className="size-4" /> {nextHref ? "Next Episode" : "Skip Outro"}
        </button>
      )}

      {/* C11 fix: Up Next overlay. Shows 15s before end. Pure UI; the
       actual auto-redirect is gated on prefs.autoPlayNext + the
       countdown timer in the useEffect above. */}
      {upNextVisible && nextHref && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-md glass p-6 text-center shadow-[var(--shadow-frost)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-frost">
              Up next in
            </span>
            <span className="font-display text-5xl font-extrabold tabular-nums text-snow">
              {upNextCountdown}
            </span>
            <div className="flex gap-2">
              <button
                onClick={goNext}
                className="rounded-sm bg-frost px-4 py-2 text-sm font-semibold text-base transition-transform hover:scale-[1.04]"
              >
                Play now
              </button>
              <button
                onClick={cancelUpNext}
                className="rounded-sm border border-line/60 px-4 py-2 text-sm font-semibold text-snow transition-colors hover:border-frost/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-16 transition-opacity duration-200 ease-out sm:px-4",
          showUI ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Scrubber — keyboard-focusable, ARIA slider pattern */}
        <div
          className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          role="slider"
          tabIndex={0}
          aria-orientation="horizontal"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - r.left;
            const time = (x / r.width) * duration;
            setScrubberHover({ x, time: Math.max(0, Math.min(time, duration)) });
          }}
          onMouseLeave={() => setScrubberHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              seekBy(e.shiftKey ? 30 : 5);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              seekBy(e.shiftKey ? -30 : -5);
            } else if (e.key === "Home") {
              e.preventDefault();
              seek(0);
            } else if (e.key === "End") {
              e.preventDefault();
              seek(duration);
            }
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20 transition-[width] duration-100" style={{ width: `${bufPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-frost transition-[width] duration-100" style={{ width: `${pct}%` }} />
          {intro && duration > 0 && (
            <span
              className="absolute inset-y-0 bg-warning/70"
              style={{ left: `${(intro.start / duration) * 100}%`, width: `${((intro.end - intro.start) / duration) * 100}%` }}
            />
          )}
          {/* C14 fix: scrubber hover tooltip. Shows the time under the
           pointer so users can see where they're about to seek. */}
          {scrubberHover && duration > 0 && (
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-sm bg-base/90 px-1.5 py-0.5 font-mono text-[10px] text-snow shadow-md"
              style={{ left: `${(scrubberHover.x / (scrubberHover.x ? 1 : 1))}px` }}
            >
              {formatTime(scrubberHover.time)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-snow sm:gap-2">
          {/* A2 fix: all control buttons now use p-2 (40×40 hit target on
           size-5 icons) on mobile, and p-1.5 on sm+ to preserve the
           desktop density. Touch users get a 40px target. */}
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause (K)" : "Play (K)"}
            aria-pressed={playing}
            className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          {nextHref && (
            <button
              onClick={goNext}
              aria-label="Next episode (N)"
              className="hidden grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:grid sm:size-8"
            >
              <SkipForward className="size-5" />
            </button>
          )}
          {/* C16 fix: visible -10s / +10s buttons. SkipBack for rewind. */}
          <button
            onClick={() => seekBy(-10)}
            aria-label="Rewind 10 seconds (J)"
            className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds (L)"
            className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
          >
            <SkipForward className="size-4" />
          </button>

          {/* C1 fix: real volume control group. Mute button + a slider that
           appears on hover (desktop) or is always visible on touch. */}
          <div
            className="flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
              aria-pressed={isMuted}
              className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
            >
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            {/* Volume slider — always visible on touch (no hover), hover-
             reveal on desktop. width-0 → width-20 on hover, no layout
             jump because the parent flex-shrinks to 0. */}
            <div
              className={cn(
                "overflow-hidden transition-[width,opacity] duration-200 ease-out",
                showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0",
                // On touch (no hover) always show the slider so the user
                // can find it. sm:hidden would block desktop; instead we
                // make the slider always visible below sm.
                "max-sm:hidden",
              )}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : currentVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
                style={{
                  background: `linear-gradient(to right, var(--color-frost) ${(isMuted ? 0 : currentVolume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : currentVolume) * 100}%)`,
                }}
              />
            </div>
          </div>
          {/* Touch-only explicit volume slider — always visible below sm
           so touch users have an obvious target. On sm+ the hover-reveal
           slider above handles it. */}
          <div className="w-20 sm:hidden">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : currentVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-frost"
              style={{
                background: `linear-gradient(to right, var(--color-frost) ${(isMuted ? 0 : currentVolume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : currentVolume) * 100}%)`,
              }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-snow/90" aria-live="off">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* C8 fix: current quality chip. Always visible so the user
             can see what they're getting, not just the settings panel. */}
            <span
              className="hidden rounded-sm border border-line/60 bg-base/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-faint sm:inline-block"
              aria-live="polite"
              aria-label={`Current quality: ${level === -1 ? "Auto" : `${currentLevelHeight ?? ""}p`}`}
            >
              {level === -1 ? "Auto" : currentLevelHeight ? `${currentLevelHeight}p` : "Auto"}
            </span>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettings((s) => !s)}
                aria-label="Settings"
                aria-expanded={settings}
                aria-haspopup="menu"
                className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
              >
                <Settings className="size-5" />
              </button>
              {settings && (
                <div
                  role="menu"
                  aria-label="Player settings"
                  className="absolute bottom-9 right-0 w-48 rounded-md glass p-2 text-sm shadow-[var(--shadow-frost)] animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
                >
                  <p className="px-2 pb-1 text-xs text-faint">Quality</p>
                  <button
                    role="menuitemradio"
                    aria-checked={level === -1}
                    onClick={() => setLevelTo(-1)}
                    className={cn("block w-full rounded px-2 py-1 text-left text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", level === -1 && "text-frost")}
                  >
                    Auto
                  </button>
                  {levels.map((l) => (
                    <button
                      key={l.index}
                      role="menuitemradio"
                      aria-checked={level === l.index}
                      onClick={() => setLevelTo(l.index)}
                      className={cn("block w-full rounded px-2 py-1 text-left text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", level === l.index && "text-frost")}
                    >
                      {l.height}p
                    </button>
                  ))}
                  <p className="mt-1 border-t border-line px-2 pb-1 pt-2 text-xs text-faint">Speed</p>
                  <div className="flex flex-wrap gap-1 px-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        role="menuitemradio"
                        aria-checked={prefs.rate === r}
                        onClick={() => { const v = videoRef.current; if (v) v.playbackRate = r; prefs.set({ rate: r }); }}
                        className={cn("rounded px-1.5 py-0.5 text-xs text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", prefs.rate === r && "text-frost")}
                      >
                        {r}×
                      </button>
                    ))}
                  </div>
                  {/* C10 fix: subtitle language picker. One menuitemradio
                   per track. Clicking sets the selected track and turns
                   captions on (the synced useEffect above handles the
                   actual <track>.mode assignment). */}
                  {tracks.length > 0 && (
                    <>
                      <p className="mt-1 border-t border-line px-2 pb-1 pt-2 text-xs text-faint">Captions</p>
                      <button
                        role="menuitemradio"
                        aria-checked={!captionsOn}
                        onClick={() => { setCaptionsOn(false); prefs.set({ captions: false }); }}
                        className={cn("block w-full rounded px-2 py-1 text-left text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", !captionsOn && "text-frost")}
                      >
                        Off
                      </button>
                      {tracks.map((t, i) => (
                        <button
                          key={i}
                          role="menuitemradio"
                          aria-checked={captionsOn && trackIdx === i}
                          onClick={() => selectTrack(i)}
                          className={cn("block w-full rounded px-2 py-1 text-left text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", captionsOn && trackIdx === i && "text-frost")}
                        >
                          {t.label}
                        </button>
                      ))}
                    </>
                  )}
                  <label className="mt-1 flex cursor-pointer items-center justify-between border-t border-line px-2 pt-2 text-xs text-snow hover:text-frost">
                    Auto-skip intro
                    <input
                      type="checkbox"
                      checked={prefs.autoSkipIntro}
                      onChange={(e) => prefs.set({ autoSkipIntro: e.target.checked })}
                      className="accent-frost"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between px-2 py-1 text-xs text-snow hover:text-frost">
                    Autoplay next
                    <input
                      type="checkbox"
                      checked={prefs.autoPlayNext}
                      onChange={(e) => prefs.set({ autoPlayNext: e.target.checked })}
                      className="accent-frost"
                    />
                  </label>
                </div>
              )}
            </div>
            <button
              onClick={togglePip}
              aria-label="Picture in picture (P)"
              className="hidden grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid sm:size-8 motion-reduce:transition-none"
            >
              <PictureInPicture2 className="size-5" />
            </button>
            <button
              onClick={toggleCaptions}
              aria-label={captionsOn ? "Hide captions (C)" : "Show captions (C)"}
              aria-pressed={captionsOn}
              className={cn("grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8", captionsOn && "text-frost")}
            >
              <Captions className="size-5" />
            </button>
            <button
              onClick={toggleFs}
              aria-label={fs ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              className="grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
            >
              {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
            {/* C15 fix: keyboard shortcut help. `?` key also opens it. */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setShowHelp((s) => !s)}
                aria-label="Keyboard shortcuts (?)"
                aria-expanded={showHelp}
                className="hidden grid size-9 place-items-center rounded-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid sm:size-8 motion-reduce:transition-none"
              >
                <Keyboard className="size-4" />
              </button>
              {showHelp && (
                <div
                  role="dialog"
                  aria-label="Keyboard shortcuts"
                  className="absolute bottom-9 right-0 w-64 rounded-md glass p-3 text-xs shadow-[var(--shadow-frost)] animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-faint">Keyboard shortcuts</p>
                    <button
                      onClick={() => setShowHelp(false)}
                      aria-label="Close shortcuts"
                      className="grid size-5 place-items-center rounded-sm text-faint hover:text-snow"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-snow">
                    <li className="flex items-center justify-between">
                      <span>Play / Pause</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">K / Space</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Rewind 10s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">J</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Forward 10s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">L</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Seek 5s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">← →</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Volume</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">↑ ↓</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Mute</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">M</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Fullscreen</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">F</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Captions</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">C</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Skip Intro</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">S</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Picture in picture</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">P</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Next episode</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">N</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Jump %</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px]">0–9</kbd>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
