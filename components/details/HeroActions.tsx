"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { isInList as isInListLocal, toggleList, WATCHLIST_EVENT } from "@/lib/watchlist/local";

/**
 * Client-only action buttons for the detail hero. Kept as a small island
 * so `HeroSection` itself stays a server component and the hero's
 * poster/metadata paint server-side. Mirrors the button behavior from the
 * watch page's `CinematicInfo` (same `toggleList` util + `WATCHLIST_EVENT`
 * sync + `aria-pressed`), without editing that file.
 */
export function HeroActions({
  anime,
}: {
  anime: { id: string; title: string; poster: string | null; type: string | null };
}) {
  const [inList, setInList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setInList(isInListLocal(anime.id));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [anime.id]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const added = toggleList({
            id: anime.id,
            title: anime.title,
            poster: anime.poster,
            type: anime.type,
          });
          flashToast(added ? "Added to My List" : "Removed from My List");
        }}
        aria-pressed={inList}
        className={cn(
          "press text-btn inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-btn)] border px-3.5 transition-colors duration-300",
          inList
            ? "border-frost/70 bg-frost/25 text-snow"
            : "border-line bg-surface/60 text-muted hover:border-frost/40 hover:text-snow",
        )}
      >
        {inList ? (
          <Check className="size-3.5" />
        ) : (
          <Plus className="size-3.5 transition-transform group-hover:rotate-90" />
        )}
        {inList ? "In My List" : "My List"}
      </button>

      <button
        type="button"
        onClick={async () => {
          const url =
            typeof window !== "undefined"
              ? `${window.location.origin}/anime/${anime.id}`
              : `/anime/${anime.id}`;
          try {
            if (typeof navigator !== "undefined" && navigator.share) {
              await navigator.share({ title: anime.title, url });
              return;
            }
          } catch {
            /* user cancelled */
          }
          try {
            await navigator.clipboard.writeText(url);
            flashToast("Link copied");
          } catch {
            flashToast("Couldn't copy link");
          }
        }}
        className="press text-btn inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-btn)] border border-line bg-surface/60 px-3.5 text-muted transition-colors duration-300 hover:border-frost/40 hover:text-snow"
      >
        <Share2 className="size-3.5" />
        Share
      </button>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-sm border border-frost/40 bg-frost-soft px-3 py-1.5 text-xs font-semibold text-frost"
        >
          {toast}
        </div>
      )}
    </>
  );
}
