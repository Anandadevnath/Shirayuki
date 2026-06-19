"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded mount point for the falling-snow canvas. `ssr: false` keeps the
 * SnowLayer chunk out of the server bundle and out of the critical render
 * path — the canvas + requestAnimationFrame loop only start once the page
 * is interactive, which protects LCP/TBT on routes that don't need the
 * snow to render (e.g. the watch page, where the user is about to focus
 * on the video). Once mounted, the underlying animation runs identically
 * (same RAF loop, same flake math, same canvas) — only the mount timing
 * is deferred.
 */
export const SnowLayerIsland = dynamic(
  () => import("./SnowLayer").then((m) => m.SnowLayer),
  { ssr: false },
);
