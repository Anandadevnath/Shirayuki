"use client";

/**
 * Watch-page layout stage. Owns the two VIEW-ONLY modes the toolbar toggles:
 *
 *   · Expand — widens the player column (the grid's fixed sidebar column is
 *     temporarily dropped) while preserving the player's 16:9 aspect ratio.
 *   · Focus  — dims everything on the page EXCEPT the player + its meta panel
 *     with a backdrop, and scroll-locks the body; Escape or a backdrop click
 *     exits. Reduced-motion users get no fade.
 *
 * It renders the toolbar, the player (a server-rendered slot), the episode-meta
 * panel, the episode sidebar, and the report dialog. All playback state stays in
 * the Player; this component never touches the video element, so a toolbar
 * click can never start/stop playback.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";
import { PlayerToolbar } from "@/components/watch/PlayerToolbar";
import { ReportDialog } from "@/components/watch/ReportDialog";

export interface WatchStageProps {
  anime: {
    id: string;
    title: string;
    poster: string | null;
    type: string | null;
    totalEpisodes: number | null;
  };
  prevHref: string | null;
  nextHref: string | null;
  skipAvailable: { intro: boolean; outro: boolean };
  report: {
    episodeId: string | null;
    episodeNumber: number | null;
    server: string | null;
    audio: "sub" | "dub";
  };
  /** Server-rendered player element (the PlayerLoader). */
  player: ReactNode;
  /** Server-rendered episode-meta INNER content (title strip + SUB/DUB +
   *  server switcher). WatchStage wraps it in the meta panel and puts the
   *  toolbar at the top of that container — a Client Component cannot receive
   *  a render function across the RSC boundary, so the page passes plain
   *  content and the styling of the wrapper lives here. */
  metaContent: ReactNode;
  /** Server-rendered episode sidebar (recessed in focus mode). */
  sidebar: ReactNode;
}

export function WatchStage({
  anime, prevHref, nextHref, skipAvailable, report, player, metaContent, sidebar,
}: WatchStageProps) {
  const [expanded, setExpanded] = useState(false);
  const [focus, setFocus] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const reduced = useReducedMotionSSR();

  const exitFocus = useCallback(() => setFocus(false), []);

  // Escape exits focus mode; lock body scroll so the dimmed page is static.
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [focus]);

  const gridCols = expanded ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_360px]";

  const toolbar = (
    <PlayerToolbar
      anime={anime}
      prevHref={prevHref}
      nextHref={nextHref}
      skipAvailable={skipAvailable}
      onReport={() => setReportOpen(true)}
      expanded={expanded}
      onToggleExpand={() => setExpanded((v) => !v)}
      focus={focus}
      onToggleFocus={() => setFocus((v) => !v)}
    />
  );

  return (
    <div className={cn("relative", focus && "z-50")}>
      {/* Focus-mode backdrop: a fixed, dimming layer with click-to-exit. It sits
          UNDER the stage grid (which is raised to z-50 above it) and OVER the
          rest of the page, so the player stays interactive and everything else
          is both dimmed and covered. */}
      {focus && (
        <div
          className={cn(
            "fixed inset-0 z-[-1] bg-base/85 backdrop-blur-sm",
            !reduced && "transition-opacity duration-300",
          )}
          aria-hidden
          onClick={exitFocus}
        />
      )}

      <div className={cn("grid items-stretch gap-6", gridCols, focus && "relative px-2 py-6 sm:px-6")}>
        <div className="flex min-w-0 flex-col gap-3">
          {focus && (
            <button
              type="button"
              onClick={exitFocus}
              className="press self-end inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] glass px-3 py-1.5 text-caption text-snow"
            >
              <X className="size-3.5" /> Exit focus
            </button>
          )}

          {player}

          {/* Meta panel: the toolbar sits at the top of ONE compact container
              that also holds the title + SUB/DUB + server switcher. Stays
              visible in focus mode so sources can still be switched. */}
          <div className="laser-frame laser-live glass watch-glass relative flex min-w-0 flex-col overflow-hidden rounded-md">
            <div className="border-b border-white/10 px-5 py-3.5 sm:px-6">{toolbar}</div>
            {metaContent}
          </div>
        </div>

        {!expanded && sidebar}
      </div>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        context={{ animeId: anime.id, ...report }}
      />
    </div>
  );
}
