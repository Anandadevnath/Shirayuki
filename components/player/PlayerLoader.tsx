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
      <div className="aspect-video w-full rounded-t-md bg-black" aria-hidden />
    ),
  },
);
