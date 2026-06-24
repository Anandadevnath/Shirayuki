"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getProgress } from "@/lib/progress/local";

/**
 * Client island that picks the resume episode and router.replace's into the
 * player route. Renders a quiet "Loading…" placeholder during the redirect
 * so the URL change feels seamless.
 *
 * Why client-side: the progress map lives in localStorage which is only
 * accessible in the browser. The server already gave us the ordered list of
 * episode ids; this component compares against saved progress and picks the
 * first episode that is *after* the saved one (so the user resumes at the
 * episode after their last watched one, which is the common streaming UX).
 */
export function WatchRedirectClient({
  animeId,
  episodeIds,
}: {
  animeId: string;
  episodeIds: string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const saved = getProgress(animeId);
    let target = episodeIds[0];
    if (saved) {
      const savedIdx = episodeIds.indexOf(saved.episodeId);
      // Resume at the episode *after* the saved one (or the saved episode
      // if no next one exists). The watch page's own progress-restore logic
      // handles "I want to continue THIS episode from where I stopped."
      if (savedIdx >= 0 && savedIdx + 1 < episodeIds.length) {
        target = episodeIds[savedIdx + 1];
      } else {
        target = saved.episodeId;
      }
    }
    router.replace(`/watch/${animeId}/${encodeURIComponent(target)}`);
  }, [animeId, episodeIds, router]);

  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <Loader2 className="size-6 animate-spin text-frost" />
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}
