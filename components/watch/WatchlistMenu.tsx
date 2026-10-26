"use client";

/**
 * "Edit List" status menu (watch page + detail hero). A single control that
 * reflects and sets the user's list status for a title:
 *   Watching · Planned · Watched · On-Hold · Dropped · Remove.
 *
 * Persistence is local-first using the EXISTING `lib/watchlist/local` store
 * (the signed-out fallback), then MIRRORED to the server through the tracking
 * layer when signed in (`mirrorWatchlistStatus` / `mirrorWatchlistRemove`) —
 * the same additive pattern progress uses. The button re-reads on the existing
 * `WATCHLIST_EVENT` so every mounted control stays in sync without prop
 * drilling, and it never navigates away from the watch page.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, BookmarkCheck, Check, ChevronDown, Trash2 } from "lucide-react";
import {
  getStatus,
  removeFromList,
  setStatus,
  isInList,
  LIST_STATUSES,
  WATCHLIST_EVENT,
  type ListEntry,
  type ListStatus,
} from "@/lib/watchlist/local";
import { mirrorWatchlistStatus, mirrorWatchlistRemove } from "@/lib/tracking/client";
import { cn } from "@/lib/utils/cn";

export interface WatchlistMenuProps {
  anime: {
    id: string;
    title: string;
    poster: string | null;
    type: string | null;
    totalEpisodes?: number | null;
  };
  /** "compact" for the player toolbar, "default" for the hero. */
  variant?: "default" | "compact";
  className?: string;
}

export function WatchlistMenu({ anime, variant = "default", className }: WatchlistMenuProps) {
  const [status, setLocalStatus] = useState<ListStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [flashPos, setFlashPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sync = () => setLocalStatus(getStatus(anime.id));

  useEffect(() => {
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.id]);

  // The meta panel uses `overflow-hidden` (rounded corners + laser frame), which
  // would CLIP an in-flow dropdown. Positioning is computed from the button's
  // viewport rect and the menu is rendered in a portal to <body>, so it escapes
  // the clip and any stacking context. Recomputed while open (scroll/resize).
  const place = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const MENU_W = 176; // w-44
    const MENU_H = 216; // ~5 items + Remove + status header
    const GAP = 8;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8));
    // Prefer opening downward; flip above the button when the menu would run
    // past the viewport bottom, and clamp so it never overflows either edge.
    const below = r.bottom + GAP;
    const flipUp = below + MENU_H > window.innerHeight && r.top - GAP - MENU_H > 0;
    const top = flipUp
      ? r.top - GAP - MENU_H
      : Math.max(GAP, Math.min(below, window.innerHeight - MENU_H - GAP));
    setPos({ top, left });
    // The toast always anchors just below the button (clamped to the viewport).
    setFlashPos({
      top: Math.min(r.bottom + GAP, window.innerHeight - 28),
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // Click-outside + Escape to dismiss, plus reposition on scroll/resize.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  };

  const base: Omit<ListEntry, "addedAt" | "status"> = {
    id: anime.id,
    title: anime.title,
    poster: anime.poster,
    type: anime.type,
    totalEpisodes: anime.totalEpisodes ?? null,
  };

  const choose = (next: ListStatus) => {
    const entry = setStatus(base, next);
    if (!entry) return; // unsafe/refused key
    mirrorWatchlistStatus({
      animeId: anime.id,
      title: anime.title,
      poster: anime.poster,
      type: anime.type,
      status: next,
    });
    setOpen(false);
    flashToast(`Moved to ${LIST_STATUSES.find((s) => s.value === next)?.label}`);
  };

  const remove = () => {
    removeFromList(anime.id);
    mirrorWatchlistRemove(anime.id);
    setOpen(false);
    flashToast("Removed from your list");
  };

  const onList = status !== null || isInList(anime.id);
  const currentLabel = status ? LIST_STATUSES.find((s) => s.value === status)?.label ?? "In list" : "Add to list";
  const compact = variant === "compact";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={onList ? `In your list: ${currentLabel}. Edit list` : "Add to list"}
        className={cn(
          "press inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
          compact ? "h-8 px-2 text-caption" : "h-10 px-3.5 text-btn",
          onList
            ? "border-frost/60 bg-frost-soft font-semibold text-frost"
            : "border-line bg-surface/60 text-muted hover:border-frost/40 hover:text-snow",
        )}
      >
        {onList ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        <span className={compact ? "hidden lg:inline" : undefined}>{onList ? currentLabel : "Add to list"}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Edit list"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="menu-in z-[60] w-44 overflow-hidden rounded-md glass p-1 text-sm shadow-[var(--shadow-frost)] motion-reduce:animate-none"
          >
            <p className="px-2.5 py-1.5 text-caption text-faint">Status</p>
            {LIST_STATUSES.map((s) => (
              <button
                key={s.value}
                role="menuitemradio"
                aria-checked={status === s.value}
                onClick={() => choose(s.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-snow transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost",
                  status === s.value && "text-frost",
                )}
              >
                <span className="grid size-3.5 place-items-center">
                  {status === s.value && <Check className="size-3.5" />}
                </span>
                {s.label}
              </button>
            ))}
            {onList && (
              <button
                role="menuitem"
                onClick={remove}
                className="mt-0.5 flex w-full items-center gap-2 rounded-sm border-t border-line/60 px-2.5 py-1.5 text-left text-snow transition-colors hover:bg-surface-2 hover:text-warning focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-frost"
              >
                <span className="grid size-3.5 place-items-center">
                  <Trash2 className="size-3.5" />
                </span>
                Remove
              </button>
            )}
          </div>,
          document.body,
        )}

      {flash && flashPos && typeof document !== "undefined" &&
        createPortal(
          <span
            role="status"
            style={{ position: "fixed", top: flashPos.top, left: flashPos.left }}
            className="menu-in pointer-events-none z-[60] whitespace-nowrap rounded-sm bg-base/95 px-2 py-1 text-caption text-snow shadow-md motion-reduce:animate-none"
          >
            {flash}
          </span>,
          document.body,
        )}
    </div>
  );
}
