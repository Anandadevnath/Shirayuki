"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, Settings, PictureInPicture2, Captions, Loader2,
} from "lucide-react";
import { usePrefs } from "@/lib/stores/prefs";
import { saveProgress, getEpisodeSeconds, type WatchEntry } from "@/lib/progress/local";
import { formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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
  const hlsRef = useRef<unknown>(null);

  const prefs = usePrefs();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fs, setFs] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevel] = useState(-1);
  const [settings, setSettings] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
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
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          setLevels(
            data.levels
              .map((l, index) => ({ height: l.height, index }))
              .filter((l) => l.height),
          );
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

  const toggleCaptions = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !captionsOn;
    setCaptionsOn(next);
    for (let i = 0; i < v.textTracks.length; i++) {
      const t = v.textTracks[i];
      if (t.kind === "subtitles" || t.kind === "captions") {
        t.mode = next ? "showing" : "hidden";
      }
    }
  };

  const goNext = useCallback(() => {
    if (nextHref) router.push(nextHref);
  }, [nextHref, router]);

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
    // Use mousedown so the click that opened the panel doesn't immediately
    // close it (mousedown fires before the click event).
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [settings]);

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
        case "0": case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": case "9": {
          // 0–9 jumps to 0%–90% of the duration (YouTube convention).
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
    if (inOutro && prefs.autoSkipOutro && outro) {
      if (prefs.autoPlayNext && nextHref) goNext();
      else seek(outro.end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inOutro]);

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-video w-full overflow-hidden rounded-t-md bg-black ring-1 ring-line"
      onMouseMove={nudgeUI}
      onMouseLeave={() => playing && setShowUI(false)}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        playsInline
        className="size-full"
        onClick={togglePlay}
        onPlay={() => { setPlaying(true); nudgeUI(); }}
        onPause={() => { setPlaying(false); setShowUI(true); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onTimeUpdate={(e) => {
          // Throttle timeupdate to ~8Hz. The native event fires ~4Hz on
          // most browsers; the 120ms tick keeps the scrubber smooth without
          // re-rendering the entire Player tree on every event.
          const v = e.currentTarget;
          const now = performance.now();
          if (lastTickRef.current && now - lastTickRef.current < TICK_MS) return;
          lastTickRef.current = now;
          setCurrent(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => prefs.autoPlayNext && goNext()}
      >
        {tracks.map((t, i) => (
          <track
            key={i}
            kind="subtitles"
            src={`/api/subtitle?url=${encodeURIComponent(t.src)}`}
            label={t.label}
            default={t.default || i === 0}
          />
        ))}
      </video>

      {(!ready || waiting) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="size-10 animate-spin text-frost" />
        </div>
      )}

      {/* Skip buttons */}
      {inIntro && !prefs.autoSkipIntro && intro && (
        <button
          onClick={() => seek(intro.end)}
          className="absolute bottom-24 right-5 z-10 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none"
        >
          <SkipForward className="size-4" /> Skip Intro
        </button>
      )}
      {inOutro && !prefs.autoSkipOutro && outro && (
        <button
          onClick={() => (nextHref ? goNext() : seek(outro.end))}
          className="absolute bottom-24 right-5 z-10 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none"
        >
          <SkipForward className="size-4" /> {nextHref ? "Next Episode" : "Skip Outro"}
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-16 transition-opacity duration-200 ease-out",
          showUI ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Scrubber — keyboard-focusable, ARIA slider pattern */}
        <div
          className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
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
        </div>

        <div className="flex items-center gap-3 text-snow">
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause (K)" : "Play (K)"}
            className="rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none"
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          {nextHref && (
            <button
              onClick={goNext}
              aria-label="Next episode (N)"
              className="rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none"
            >
              <SkipForward className="size-5" />
            </button>
          )}
          <button
            onClick={toggleMute}
            aria-label={prefs.muted ? "Unmute (M)" : "Mute (M)"}
            className="rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none"
          >
            {prefs.muted || (videoRef.current?.volume ?? 1) === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <span className="font-mono text-xs tabular-nums text-snow/90" aria-live="off">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettings((s) => !s)}
                aria-label="Settings"
                aria-expanded={settings}
                aria-haspopup="menu"
                className="rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none"
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
                    role="menuitem"
                    onClick={() => setLevelTo(-1)}
                    className={cn("block w-full rounded px-2 py-1 text-left text-snow hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost", level === -1 && "text-frost")}
                  >
                    Auto
                  </button>
                  {levels.map((l) => (
                    <button
                      key={l.index}
                      role="menuitem"
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
              className="hidden rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:block motion-reduce:transition-none"
            >
              <PictureInPicture2 className="size-5" />
            </button>
            <button
              onClick={toggleCaptions}
              aria-label={captionsOn ? "Hide captions (C)" : "Show captions (C)"}
              aria-pressed={captionsOn}
              className={cn("rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none", captionsOn && "text-frost")}
            >
              <Captions className="size-5" />
            </button>
            <button
              onClick={toggleFs}
              aria-label={fs ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              className="rounded-sm p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none"
            >
              {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}