"use client";

/**
 * Watch-page player toolbar (AnimeKai-inspired, Shirayuki identity). A compact
 * control strip ABOVE the player frame:
 *
 *   Expand · Focus · AutoNext · AutoPlay · AutoSkip · Prev · Next · Edit List · Report
 *
 * Responsibilities are deliberately thin: it drives LAYOUT (expand/focus) and
 * edits the EXISTING persisted prefs (`usePrefs`) that the Player already reads
 * (autoPlayNext / autoSkipIntro+Outro). Playback itself stays in the Player —
 * this toolbar never touches the video element, so a control click can never
 * accidentally start/stop playback.
 *
 * Download is intentionally absent: the upstream provider exposes no download
 * endpoint, so no control is shown (never a fake action).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Maximize2, Minimize2, Focus, ChevronLeft, ChevronRight,
  FastForward, PlayCircle, SkipForward, Flag, Loader2,
} from "lucide-react";
import { usePrefs } from "@/lib/stores/prefs";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";
import { cn } from "@/lib/utils/cn";
import { WatchlistMenu } from "@/components/watch/WatchlistMenu";

export interface PlayerToolbarProps {
  anime: {
    id: string;
    title: string;
    poster: string | null;
    type: string | null;
    totalEpisodes: number | null;
  };
  prevHref: string | null;
  nextHref: string | null;
  /** Whether the current source exposes intro/outro timings. When false the
   *  AutoSkip toggle is shown disabled with an explanation — never a fake. */
  skipAvailable: { intro: boolean; outro: boolean };
  /** Opens the report dialog owned by the page (single dialog instance). */
  onReport: () => void;
  /** Expand/focus are owned by the page (layout lives there). */
  expanded: boolean;
  onToggleExpand: () => void;
  focus: boolean;
  onToggleFocus: () => void;
}

interface ToolButtonProps {
  onClick?: () => void;
  href?: string | null;
  active?: boolean;
  disabled?: boolean;
  busy?: boolean;
  label: string;
  title: string;
  children: React.ReactNode;
}

function ToolButton({ onClick, href, active, disabled, busy, label, title, children }: ToolButtonProps) {
  const cls = cn(
    "press inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-btn)] border px-2 text-caption transition-colors duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
    active
      ? "border-frost/60 bg-frost-soft font-semibold text-frost"
      : "border-line/70 bg-surface/50 text-muted hover:border-frost/40 hover:text-snow",
    disabled && "pointer-events-none opacity-40",
  );
  const content = (
    <>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : children}
      <span className="hidden lg:inline">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-pressed={active}
      title={title}
      aria-label={title}
      className={cls}
    >
      {content}
    </button>
  );
}

export function PlayerToolbar({
  anime, prevHref, nextHref, skipAvailable, onReport,
  expanded, onToggleExpand, focus, onToggleFocus,
}: PlayerToolbarProps) {
  const prefs = usePrefs();
  const reduced = useReducedMotionSSR();
  const [autoSkipChoice, setAutoSkipChoice] = useState<"none" | "intro" | "outro" | "both">(() => {
    if (prefs.autoSkipIntro && prefs.autoSkipOutro) return "both";
    if (prefs.autoSkipIntro) return "intro";
    if (prefs.autoSkipOutro) return "outro";
    return "none";
  });

  // Re-derive the cycle label whenever the store changes (e.g. the Player's
  // own settings menu toggles the same flags — the toolbar must not disagree).
  // Clamp to what the SOURCE supports so the label never claims a skip range
  // that has no timestamps (e.g. a stored "both" on an intro-only source shows
  // "Skip Intro").
  useEffect(() => {
    const intro = prefs.autoSkipIntro && skipAvailable.intro;
    const outro = prefs.autoSkipOutro && skipAvailable.outro;
    if (intro && outro) setAutoSkipChoice("both");
    else if (intro) setAutoSkipChoice("intro");
    else if (outro) setAutoSkipChoice("outro");
    else setAutoSkipChoice("none");
  }, [prefs.autoSkipIntro, prefs.autoSkipOutro, skipAvailable.intro, skipAvailable.outro]);

  const cycleAutoSkip = useCallback(() => {
    // Build the list of states the SOURCE actually supports, so the control can
    // never enable a skip for a range that has no timestamps.
    const canIntro = skipAvailable.intro;
    const canOutro = skipAvailable.outro;
    const states: ("none" | "intro" | "outro" | "both")[] = ["none"];
    if (canIntro) states.push("intro");
    if (canIntro && canOutro) states.push("both");
    if (canOutro) states.push("outro");
    const idx = states.indexOf(autoSkipChoice);
    const next = states[(idx + 1) % states.length] ?? "none";
    prefs.set({
      autoSkipIntro: next === "intro" || next === "both",
      autoSkipOutro: next === "outro" || next === "both",
    });
  }, [autoSkipChoice, prefs, skipAvailable.intro, skipAvailable.outro]);

  const skipLabel =
    autoSkipChoice === "none" ? "AutoSkip Off"
    : autoSkipChoice === "intro" ? "Skip Intro"
    : autoSkipChoice === "both" ? "Skip Intro+Outro"
    : "Skip Outro";

  const skipUnavailable = !skipAvailable.intro && !skipAvailable.outro;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        // Fade the strip while focus mode is active so the player is the hero.
        focus && "opacity-40 transition-opacity duration-300 hover:opacity-100",
        reduced && "transition-none",
      )}
    >
      <ToolButton
        onClick={onToggleExpand}
        active={expanded}
        label={expanded ? "Collapse" : "Expand"}
        title={expanded ? "Collapse the player (exit wide layout)" : "Expand the player to a wider layout"}
      >
        {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </ToolButton>

      <ToolButton
        onClick={onToggleFocus}
        active={focus}
        label="Focus"
        title={focus ? "Exit focus mode" : "Focus mode — dim the page around the player"}
      >
        <Focus className="size-4" />
      </ToolButton>

      <span className="mx-0.5 hidden h-5 w-px bg-line/60 sm:block" aria-hidden />

      <ToolButton
        onClick={() => prefs.set({ autoPlayNext: !prefs.autoPlayNext })}
        active={prefs.autoPlayNext}
        label="AutoNext"
        title="Automatically play the next episode when this one ends"
      >
        <SkipForward className="size-4" />
      </ToolButton>

      <ToolButton
        onClick={() => prefs.set({ autoPlay: !prefs.autoPlay })}
        active={prefs.autoPlay}
        label="AutoPlay"
        title="Start playing automatically when an episode opens"
      >
        <PlayCircle className="size-4" />
      </ToolButton>

      <ToolButton
        onClick={cycleAutoSkip}
        active={autoSkipChoice !== "none"}
        disabled={skipUnavailable}
        label={skipLabel}
        title={
          skipUnavailable
            ? "Skip data is unavailable for this episode"
            : "Cycle auto-skip: off → intro → intro+outro → outro"
        }
      >
        <FastForward className="size-4" />
      </ToolButton>

      <span className="mx-0.5 hidden h-5 w-px bg-line/60 sm:block" aria-hidden />

      <ToolButton href={prevHref} disabled={!prevHref} label="Prev" title="Previous episode">
        <ChevronLeft className="size-4" />
      </ToolButton>
      <ToolButton href={nextHref} disabled={!nextHref} label="Next" title="Next episode">
        <ChevronRight className="size-4" />
      </ToolButton>

      <div className="ml-auto flex items-center gap-1.5">
        <WatchlistMenu anime={anime} variant="compact" />
        <ToolButton onClick={onReport} label="Report" title="Report a playback issue">
          <Flag className="size-4" />
        </ToolButton>
      </div>
    </div>
  );
}
