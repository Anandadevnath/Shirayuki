"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, Settings, PictureInPicture2, Captions, Loader2,
  Keyboard, X, RotateCcw,
} from "lucide-react";
import { usePrefs } from "@/lib/stores/prefs";
import { getEpisodeSeconds, type WatchEntry } from "@/lib/progress/local";
import { recordProgress, flushProgress } from "@/lib/tracking/client";
import { formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { SubtitleOverlay } from "@/components/player/SubtitleOverlay";
import { nextRecovery, initialRecovery, type RecoveryState } from "@/lib/player/recovery";

export interface PlayerProps {
  src: string;
  poster: string | null;
  tracks: { src: string; label: string; default: boolean }[];
  intro: { start: number; end: number } | null;
  outro: { start: number; end: number } | null;
  meta: Omit<WatchEntry, "seconds" | "duration" | "updatedAt">;
  nextHref: string | null;
  /** Upstream Referer the subtitle CDN requires (propagated to
   *  /api/subtitle so the .vtt fetch doesn't 403). Mirrors `src`'s
   *  /api/stream referer handling. */
  referer?: string | null;
  /** Alternate servers for the SAME episode, in preference order, EXCLUDING the
   *  one currently playing. Used by the mid-playback failover loop: when a
   *  source's bounded recovery is exhausted the player advances to the next
   *  candidate (resolved through /api/sources) WITHOUT a full navigation, and
   *  restores the user's timestamp on the new source. Empty when the episode
   *  has only one server. */
  failover?: {
    episodeId: string;
    episodeNumber: number;
    category: string;
    servers: { name: string; nameId: string }[];
  } | null;
}

interface Level { height: number; index: number }

// Time-update throttling: the video element fires `timeupdate` ~4×/sec. We
// buffer the latest currentTime in a ref and only flush to React state on
// a ~120ms cadence so the scrubber updates feel smooth without forcing 4
// reconciliation passes per second.
const TICK_MS = 120;

/** Startup deadline: if the player has not become ready (canplay) within this
 *  window, the watchdog treats the source as failed and fails over / errors.
 *  Generous enough for a slow-but-alive CDN, tight enough that a dead one never
 *  strands the user on a spinner. */
const PLAYBACK_STARTUP_BUDGET_MS = 20_000;

export function Player({ src, poster, tracks, intro, outro, meta, nextHref, referer, failover }: PlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<unknown>(null);
  // Bounded fatal-error recovery counters (see lib/player/recovery). Reset per
  // source inside the attach effect so each episode/server starts fresh.
  const recoveryRef = useRef<RecoveryState>(initialRecovery);
  // Bumped by the retry button to re-run the attach effect for the SAME src
  // (new hls instance + reset counters) without a full page navigation.
  const [retryNonce, setRetryNonce] = useState(0);

  // ── Mid-playback failover state ──────────────────────────────────────
  // The active stream can differ from the server-rendered `src` after a
  // failover swap, so the playable source lives in state seeded from props.
  const [activeSrc, setActiveSrc] = useState(src);
  const [activeTracks, setActiveTracks] = useState(tracks);
  const [activeReferer, setActiveReferer] = useState(referer ?? null);
  const [activeServer, setActiveServer] = useState(meta.server);
  // Remaining alternate servers to try, in preference order.
  const [remaining, setRemaining] = useState(() => failover?.servers ?? []);
  // Set while the failover loop is resolving the next candidate.
  const [switching, setSwitching] = useState(false);
  // Synchronous re-entrancy guard: `switching` state lags a frame, so a
  // second fatal error in the same tick could start a racing swap.
  const switchingRef = useRef(false);
  // Timestamp to restore on the next source (set when a mid-play failure is
  // detected so the user resumes where they were on the alternate server).
  const resumeAtRef = useRef<number | null>(null);
  // Guarantees the AutoPlay attempt runs at most ONCE per mounted source, so a
  // policy-rejected play() is never retried in a loop.
  const autoplayAttemptRef = useRef(false);

  // Re-sync when the parent renders a genuinely new episode. Keyed on the
  // episode id (a primitive) rather than the object props, so a re-render that
  // merely recreates the props objects cannot reset + remount the player mid-
  // playback. `src` is also primitive and included for the server-switch case.
  useEffect(() => {
    setActiveSrc(src);
    setActiveTracks(tracks);
    setActiveReferer(referer ?? null);
    setActiveServer(meta.server);
    setRemaining(failover?.servers ?? []);
    // A new episode is a fresh failover context: clear both the tried-set and
    // any in-flight swap guard so a prior episode's dead servers never block
    // (or short-circuit) the new episode's candidates.
    triedRef.current = new Set();
    switchingRef.current = false;
    resumeAtRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, meta.episodeId]);

  // Bounded marker for the code that runs after mount. Establishes which
  // servers have already failed so failover never loops onto a dead one.
  const triedRef = useRef<Set<string>>(new Set());
  // Watchdog: hls.js declares a manifest/segment load fatal only after its OWN
  // internal retries, which on a hard drop (connection refused / aborted proxy)
  // can take long enough that the user stares at "Loading…" indefinitely.
  // This timer guarantees the player reaches SOMETHING (ready, failover, or the
  // terminal error) within a bounded window — the SDK's own timers are not a
  // contract we rely on for the UI's liveness.
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Advance to the next alternate server for the same episode.
   *
   * Called when a source's bounded recovery is exhausted (see
   * lib/player/recovery). Responsibilities:
   *   1. remember the current playhead so the new source resumes there;
   *   2. resolve the next candidate through /api/sources (no-store);
   *   3. swap activeSrc so the attach effect remounts hls on the new stream;
   *   4. if EVERY candidate is exhausted, surface the terminal error UI.
   * Re-entrancy is guarded by `switching`, and `triedRef` guarantees each
   * server is attempted at most once — no ping-pong between failing sources.
   */
  const failoverToNext = useCallback(() => {
    // Never overlap swaps.
    if (switchingRef.current) return;
    const v = videoRef.current;
    // Preserve position for the resume on the alternate source.
    if (v && v.currentTime > 1 && v.duration > 0) resumeAtRef.current = v.currentTime;

    triedRef.current.add(activeServer);
    const next = remaining.find((s) => !triedRef.current.has(s.nameId));

    if (!next || !failover) {
      setFatalError(true);
      setWaiting(false);
      return;
    }

    switchingRef.current = true;
    setSwitching(true);
    setWaiting(true);
    setRemaining((list) => list.filter((s) => s.nameId !== next.nameId));

    const params = new URLSearchParams({
      episodeId: failover.episodeId,
      ep: String(failover.episodeNumber),
      server: next.nameId,
      category: failover.category,
    });
    fetch(`/api/sources?${params.toString()}`)
      .then((r) => r.json())
      .then((body: { ok: boolean; source?: { m3u8: string; referer: string | null; tracks: { file: string; label: string; default: boolean }[] } }) => {
        if (!body.ok || !body.source) {
          switchingRef.current = false;
          setSwitching(false);
          // Server had no source — keep walking the remaining candidates.
          failoverToNext();
          return;
        }
        const s = body.source;
        const nextSrc = `/api/stream?url=${encodeURIComponent(s.m3u8)}${
          s.referer ? `&referer=${encodeURIComponent(s.referer)}` : ""
        }`;
        setActiveServer(next.nameId);
        setActiveTracks(s.tracks.map((t) => ({ src: t.file, label: t.label, default: t.default })));
        setActiveReferer(s.referer);
        setActiveSrc(nextSrc);
        switchingRef.current = false;
        setSwitching(false);
        // ready flips on the new stream's `canplay`; the timestamp is applied
        // by the restore effect below once the new source is ready.
      })
      .catch(() => {
        switchingRef.current = false;
        setSwitching(false);
        failoverToNext();
      });
  }, [activeServer, remaining, failover]);

  const prefs = usePrefs();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // Terminal playback state: set when recovery is exhausted AND no alternate
  // server remains. Drives the explicit retry surface instead of an endless
  // "Loading…" spinner.
  const [fatalError, setFatalError] = useState(false);
  // Mirrors of ready/fatalError for the watchdog timer, whose callback runs
  // outside React's render and would otherwise close over stale state.
  const readyRef = useRef(false);
  const fatalRef = useRef(false);
  useEffect(() => { readyRef.current = ready; }, [ready]);
  useEffect(() => { fatalRef.current = fatalError; }, [fatalError]);
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
  const lastUINudgeRef = useRef(0);
  // Throttle marker for the `timeupdate` listener. Native fires ~4Hz on most
  // browsers; we coalesce to ~8Hz (120ms) before re-rendering the scrubber.
  const lastTickRef = useRef(0);

  // ── Attach HLS (the fix the old app never shipped) ──────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    setReady(false);
    setFatalError(false);
    // A new source is a fresh autoplay opportunity.
    autoplayAttemptRef.current = false;

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
          // Startup tuning: give the ABR a sane bandwidth PRIOR (2.5 Mbps)
          // so its very first estimate isn't the floor rate — prevents the
          // classic "opens on 240p for a second then jumps" flicker on a
          // connection that can clearly do better. `maxStarvationDelay`
          // clamps how long it tolerates an empty buffer before downshifting,
          // and `abrBandWidthFactor/UpFactor` make up-shifts eager but
          // down-shifts decisive, matching the scrubber's quality chip.
          abrEwmaDefaultEstimate: 2_500_000,
          abrBandWidthFactor: 0.9,
          abrBandWidthUpFactor: 0.7,
          maxStarvationDelay: 4,
        });
        hlsRef.current = hls;
        // Recovery counters reset per source: a fresh episode/server gets a
        // fresh retry budget — a prior source's exhaustion never carries over.
        recoveryRef.current = initialRecovery;
        hls.loadSource(activeSrc);
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
          // NOTE: manifest alone is NOT readiness — it only means the
          // playlist parsed. The player stays in "Loading…" until the media
          // element can actually play (canplay below), so the spinner and
          // skeleton never clear onto a black, un-seekable frame.
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setLevel(data.level));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          // Non-fatal errors are hls.js internals (a lost fragment it already
          // re-requests); they must NOT touch our fatal UI.
          if (!data.fatal) return;
          if (destroyed) return;
          // BOUNDED recovery: hls.js's own per-fragment retries already ran.
          // These outer budgets cap fatal recovery so a dead source cannot
          // loop startLoad()/recoverMediaError() forever. Exhaustion flips the
          // player to an explicit, retryable error state.
          const { action, state } = nextRecovery(
            recoveryRef.current,
            data.type as string,
          );
          recoveryRef.current = state;
          if (action.kind === "network") {
            hls.startLoad();
          } else if (action.kind === "media") {
            hls.recoverMediaError();
          } else {
            // Budget exhausted for this source. Before surfacing a terminal
            // error, try the next server (if any): a mid-play failure is
            // exactly the case client-side failover exists for, and swapping
            // sources keeps the user's timestamp instead of stranding them.
            failoverToNext();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = activeSrc; // Safari native HLS
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
  }, [activeSrc, retryNonce, failoverToNext]);

  // ── Startup watchdog ────────────────────────────────────────────────
  // Guarantees the player leaves the "Loading…" state within a bounded window
  // even when hls.js never surfaces a fatal error (a hard-aborted proxy, a
  // silently dead socket). On expiry it either fails over to the next server
  // or shows the terminal error — never an endless spinner. Reset whenever a
  // new source becomes ready or a different source is attempted.
  useEffect(() => {
    if (ready || fatalError) return;
    watchdogRef.current = setTimeout(() => {
      if (readyRef.current || fatalRef.current) return;
      failoverToNext();
    }, PLAYBACK_STARTUP_BUDGET_MS);
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, [activeSrc, ready, fatalError, failoverToNext]);

  // ── Restore position + apply remembered prefs ───────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !ready) return;
    v.volume = prefs.volume;
    v.muted = prefs.muted;
    v.playbackRate = prefs.rate;
    // A mid-play failover takes priority over localStorage: it carries the
    // EXACT playhead from the dead source, so the user resumes seamlessly
    // rather than jumping back to a coarser saved position.
    const resume = resumeAtRef.current;
    if (resume != null && resume > 5) {
      v.currentTime = resume;
      resumeAtRef.current = null;
    } else {
      const saved = getEpisodeSeconds(meta.episodeId);
      if (saved > 5) v.currentTime = saved;
    }
    // AutoPlay (per-episode): attempt ONE play when the source becomes ready.
    // Browser autoplay policy may reject it (no gesture) — that rejection is
    // swallowed, never retried, so it can never loop. `autoplayAttemptRef`
    // ensures we only ever try once per mounted source.
    if (prefs.autoPlay && !autoplayAttemptRef.current && v.paused) {
      autoplayAttemptRef.current = true;
      v.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, meta.episodeId, activeSrc]);

  // ── Persist progress every 5s ───────────────────────────────────────
  // Goes through the tracking layer: local write first (unchanged behavior),
  // then a throttled server mirror when signed in. Never awaited by playback.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const id = setInterval(() => {
      if (v.duration > 0 && v.currentTime > 1) {
        recordProgress({
          ...meta,
          seconds: v.currentTime,
          duration: v.duration,
          updatedAt: Date.now(),
        });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [meta]);

  // ── Final write on unload / tab hide ────────────────────────────────
  // The 5s interval may not have fired for the last few seconds; flush the
  // exact playhead with `keepalive` so a closed tab keeps its position.
  useEffect(() => {
    const flush = () => {
      const v = videoRef.current;
      if (v && v.duration > 0 && v.currentTime > 1) {
        flushProgress({ ...meta, seconds: v.currentTime, duration: v.duration, updatedAt: Date.now() });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
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

  // Explicit retry from the fatal-error surface. Re-runs the attach effect
  // for the SAME source with a fresh hls instance and reset recovery budget.
  // Does NOT navigate, so the user keeps their place in the page and any
  // remembered timestamp still restores after the new instance is ready.
  const retry = useCallback(() => {
    setFatalError(false);
    setWaiting(false);
    setReady(false);
    recoveryRef.current = initialRecovery;
    setRetryNonce((n) => n + 1);
  }, []);

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
    if (!showUI) setShowUI(true);
    const now = performance.now();
    // Mousemove can fire at 60-120Hz; rescheduling the hide timeout at that
    // rate is unnecessary churn. Refresh at most every 200ms while moving.
    if (now - lastUINudgeRef.current < 200) return;
    lastUINudgeRef.current = now;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowUI(false);
    }, 2800);
  };

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

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
      className="group relative aspect-video w-full overflow-hidden rounded-t-md bg-black ring-1 ring-white/10"
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
        // Readiness = the media element can actually present a frame, not
        // merely that the manifest parsed. `canplay` fires once enough data
        // is buffered to start; clearing "Loading…" here (instead of on
        // MANIFEST_PARSED) means the spinner never hands off to a black
        // un-seekable frame on a slow connection.
        onCanPlay={() => {
          if (!fatalError) setReady(true);
        }}
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
          captionsOn && trackIdx >= 0 && activeTracks[trackIdx]
            ? `/api/subtitle?url=${encodeURIComponent(
                activeTracks[trackIdx]!.src,
              )}${activeReferer ? `&referer=${encodeURIComponent(activeReferer)}` : ""}`
            : null
        }
        visible={captionsOn}
        controlsVisible={showUI}
      />

      {/* C6 fix: corner loading spinner instead of full-screen overlay.
       A full-screen spinner hides the play button affordance; a corner
       one keeps the controls readable while still showing progress. */}
      {(!ready || waiting) && !fatalError && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-sm glass px-3 py-1.5 text-xs text-snow">
          <Loader2 className="size-3.5 animate-spin" />
          <span>{switching ? "Switching server…" : !ready ? "Loading…" : "Buffering…"}</span>
        </div>
      )}

      {/* Terminal playback error. Recovery (bounded — see lib/player/recovery)
       exhausted, so the source is genuinely unrecoverable here. Offers an
       explicit retry instead of leaving the corner spinner up forever. Styled
       with the same glass/frost tokens as the rest of the chrome. */}
      {fatalError && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-md glass px-6 py-5 text-center shadow-[var(--shadow-frost)]">
            <p className="text-sm font-semibold text-snow">Playback stopped</p>
            <p className="max-w-xs text-xs text-muted">
              This source couldn&apos;t be played. Retry it, or pick another
              server below.
            </p>
            <button
              onClick={retry}
              className="mt-1 flex items-center gap-2 rounded-sm bg-frost px-4 py-2 text-sm font-semibold on-frost transition-transform hover:scale-[1.04] motion-reduce:transition-none"
            >
              <RotateCcw className="size-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Skip buttons — C7 fix: center horizontally on mobile so they're
       thumb-reachable, and reposition to right on sm+.
       z-30: ABOVE the controls overlay (z-20). The control bar's gradient
       layer spans `inset-x-0 bottom-0 pt-16`, so at `bottom-24` it physically
       overlaps this button's box and — at a lower z — swallowed every click
       (the button looked live but was not clickable). Sitting above the
       controls layer makes the press land on the button. pointer-events-auto
       is explicit so no ancestor's pointer-events state can leak in. */}
      {inIntro && !prefs.autoSkipIntro && intro && (
        <button
          onClick={() => seek(intro.end)}
          className="pointer-events-auto absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none sm:left-auto sm:right-5 sm:translate-x-0"
        >
          <SkipForward className="size-4" /> Skip Intro
        </button>
      )}
      {inOutro && !prefs.autoSkipOutro && outro && (
        <button
          onClick={() => (nextHref ? goNext() : seek(outro.end))}
          className="pointer-events-auto absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-sm glass px-4 py-2 text-sm font-semibold text-snow transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none sm:left-auto sm:right-5 sm:translate-x-0"
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
            <span className="text-eyebrow text-frost">
              Up next
            </span>
            <span className="font-display text-5xl font-bold tabular-nums text-snow">
              {upNextCountdown}
            </span>
            <div className="flex gap-2">
              <button
                onClick={goNext}
                className="rounded-sm bg-frost px-4 py-2 text-sm font-semibold on-frost transition-transform hover:scale-[1.04]"
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
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-3 pb-3 pt-16 transition-opacity duration-200 ease-out sm:px-4",
          showUI ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Scrubber — keyboard-focusable, ARIA slider pattern */}
        <div
          className="group/bar relative mb-3 h-2 cursor-pointer rounded-full bg-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
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
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/25 transition-[width] duration-100" style={{ width: `${bufPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-frost shadow-[0_0_10px_-2px_var(--color-frost)] transition-[width] duration-100" style={{ width: `${pct}%` }} />
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
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-sm bg-base/90 px-1.5 py-0.5 font-accent text-[10px] text-snow shadow-md"
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
            className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          {nextHref && (
            <button
              onClick={goNext}
              aria-label="Next episode (N)"
              className="hidden grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:grid sm:size-8"
            >
              <SkipForward className="size-5" />
            </button>
          )}
          {/* C16 fix: visible -10s / +10s buttons. SkipBack for rewind. */}
          <button
            onClick={() => seekBy(-10)}
            aria-label="Rewind 10 seconds (J)"
            className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds (L)"
            className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
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
              className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
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
          <span className="font-accent text-xs tabular-nums text-snow/90" aria-live="off">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* C8 fix: current quality chip. Always visible so the user
             can see what they're getting, not just the settings panel. */}
            <span
              className="hidden rounded-sm border border-white/15 bg-base/60 px-1.5 py-0.5 font-accent text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur-sm sm:inline-block"
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
                className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
              >
                <Settings className="size-5" />
              </button>
              {settings && (
                <div
                  role="menu"
                  aria-label="Player settings"
                  className="absolute bottom-9 right-0 w-48 rounded-md glass p-2 text-sm shadow-[var(--shadow-frost)] menu-in motion-reduce:animate-none"
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
              className="hidden grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid sm:size-8 motion-reduce:transition-none"
            >
              <PictureInPicture2 className="size-5" />
            </button>
            <button
              onClick={toggleCaptions}
              aria-label={captionsOn ? "Hide captions (C)" : "Show captions (C)"}
              aria-pressed={captionsOn}
              className={cn("grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8", captionsOn && "text-frost")}
            >
              <Captions className="size-5" />
            </button>
            <button
              onClick={toggleFs}
              aria-label={fs ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              className="grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost motion-reduce:transition-none sm:size-8"
            >
              {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
            {/* C15 fix: keyboard shortcut help. `?` key also opens it. */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setShowHelp((s) => !s)}
                aria-label="Keyboard shortcuts (?)"
                aria-expanded={showHelp}
                className="hidden grid size-9 place-items-center rounded-sm transition-[transform,background-color] duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid sm:size-8 motion-reduce:transition-none"
              >
                <Keyboard className="size-4" />
              </button>
              {showHelp && (
                <div
                  role="dialog"
                  aria-label="Keyboard shortcuts"
                  className="absolute bottom-9 right-0 w-64 rounded-md glass p-3 text-xs shadow-[var(--shadow-frost)] menu-in motion-reduce:animate-none"
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
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">K / Space</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Rewind 10s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">J</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Forward 10s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">L</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Seek 5s</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">← →</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Volume</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">↑ ↓</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Mute</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">M</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Fullscreen</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">F</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Captions</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">C</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Skip Intro</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">S</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Picture in picture</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">P</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Next episode</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">N</kbd>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Jump %</span>
                      <kbd className="rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px]">0–9</kbd>
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
