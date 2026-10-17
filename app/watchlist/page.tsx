import type { Metadata } from "next";
import { PageHeader } from "@/components/common/SectionHeader";
import { WatchlistClient } from "./WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist · Continue Watching",
  description: "Pick up where you left off.",
};

/**
 * H1 fix: real /watchlist page. The Continue Watching rail on the home page
 * links here; before this fix it was a 404. The page is a thin client shell
 * because the data lives in localStorage — the server cannot read it. The
 * static shell (title + empty-state markup) ships immediately and the client
 * hydrates the rail from `listProgress()`.
 *
 * No API, endpoint, schema, or provider change. Pure frontend addition.
 */
export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader eyebrow="Pick up where you left off" title="Watchlist" />
      <WatchlistClient />
    </div>
  );
}
