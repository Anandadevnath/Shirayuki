"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper that lazy-loads the Player. The Player pulls in hls.js
 * (~3MB), zustand, and the entire control surface, so we keep it out of the
 * watch-page critical chunk. The static shell (title, server strip, episode
 * sidebar) ships immediately; the player mounts as soon as the chunk arrives
 * and the browser hydrates.
 */
export const PlayerLoader = dynamic(
  () => import("./Player").then((m) => m.Player),
  {
    ssr: false,
    loading: () => (
      // P9 fix: shimmer instead of a flat black box. The aspect-video
      // wrapper keeps the layout footprint identical so there is no shift
      // when the player chunk hydrates.
      <div className="aspect-video w-full rounded-t-md bg-surface-2 shimmer" aria-hidden />
    ),
  },
);
