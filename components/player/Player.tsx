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

export function Player({ src, poster, tracks, intro, outro, meta, nextHref }: PlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const goNext = useCallback(() => {
    if (nextHref) router.push(nextHref);
  }, [nextHref, router]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "arrowright": seek(v.currentTime + 10); break;
        case "arrowleft": seek(v.currentTime - 10); break;
        case "arrowup": e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); prefs.set({ volume: v.volume }); break;
        case "arrowdown": e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); prefs.set({ volume: v.volume }); break;
        case "m": toggleMute(); break;
        case "f": toggleFs(); break;
        case "n": goNext(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, goNext]);

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
          const v = e.currentTarget;
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
          className="absolute bottom-24 right-5 z-10 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow"
        >
          <SkipForward className="size-4" /> Skip Intro
        </button>
      )}
      {inOutro && !prefs.autoSkipOutro && outro && (
        <button
          onClick={() => (nextHref ? goNext() : seek(outro.end))}
          className="absolute bottom-24 right-5 z-10 flex items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow"
        >
          <SkipForward className="size-4" /> {nextHref ? "Next Episode" : "Skip Outro"}
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-16 transition-opacity duration-200",
          showUI ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Scrubber */}
        <div
          className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${bufPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-frost" style={{ width: `${pct}%` }} />
          {intro && duration > 0 && (
            <span
              className="absolute inset-y-0 bg-warning/70"
              style={{ left: `${(intro.start / duration) * 100}%`, width: `${((intro.end - intro.start) / duration) * 100}%` }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 text-snow">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          {nextHref && (
            <button onClick={goNext} aria-label="Next episode">
              <SkipForward className="size-5" />
            </button>
          )}
          <button onClick={toggleMute} aria-label="Mute">
            {prefs.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <span className="font-mono text-xs tabular-nums text-snow/90">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setSettings((s) => !s)} aria-label="Settings">
                <Settings className="size-5" />
              </button>
              {settings && (
                <div className="absolute bottom-9 right-0 w-44 rounded-md glass p-2 text-sm">
                  <p className="px-2 pb-1 text-xs text-faint">Quality</p>
                  <button
                    onClick={() => setLevelTo(-1)}
                    className={cn("block w-full rounded px-2 py-1 text-left hover:bg-surface-2", level === -1 && "text-frost")}
                  >
                    Auto
                  </button>
                  {levels.map((l) => (
                    <button
                      key={l.index}
                      onClick={() => setLevelTo(l.index)}
                      className={cn("block w-full rounded px-2 py-1 text-left hover:bg-surface-2", level === l.index && "text-frost")}
                    >
                      {l.height}p
                    </button>
                  ))}
                  <p className="mt-1 border-t border-line px-2 pb-1 pt-2 text-xs text-faint">Speed</p>
                  <div className="flex flex-wrap gap-1 px-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => { const v = videoRef.current; if (v) v.playbackRate = r; prefs.set({ rate: r }); }}
                        className={cn("rounded px-1.5 py-0.5 text-xs hover:bg-surface-2", prefs.rate === r && "text-frost")}
                      >
                        {r}×
                      </button>
                    ))}
                  </div>
                  <label className="mt-1 flex items-center justify-between border-t border-line px-2 pt-2 text-xs">
                    Auto-skip intro
                    <input
                      type="checkbox"
                      checked={prefs.autoSkipIntro}
                      onChange={(e) => prefs.set({ autoSkipIntro: e.target.checked })}
                    />
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 text-xs">
                    Autoplay next
                    <input
                      type="checkbox"
                      checked={prefs.autoPlayNext}
                      onChange={(e) => prefs.set({ autoPlayNext: e.target.checked })}
                    />
                  </label>
                </div>
              )}
            </div>
            <button onClick={togglePip} aria-label="Picture in picture" className="hidden sm:block">
              <PictureInPicture2 className="size-5" />
            </button>
            <button aria-label="Captions"><Captions className="size-5" /></button>
            <button onClick={toggleFs} aria-label="Fullscreen">
              {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
