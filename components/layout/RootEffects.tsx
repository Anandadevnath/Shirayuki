"use client";

import { usePathname } from "next/navigation";
import { Ambient } from "@/components/layout/Ambient";
import { SnowLayerIsland } from "@/components/layout/SnowLayerIsland";

/**
 * Route-gated mount for the always-on ambient layers.
 *
 * On `/watch/*` both `Ambient` (three 100–150px blur blobs fixed to the
 * viewport) and `SnowLayer` (a 60fps canvas) are hidden. The watch page
 * is dominated by the `<video>` element, which sits inside a `bg-black`
 * container; the frost glows sit behind the video and contribute nothing
 * to the user-visible pixels while still paying full filter + RAF cost.
 *
 * The condition is purely visual parity — `usePathname()` is reactive so
 * SPA navigations between browse/detail and the watch page flip the mount
 * without a full reload.
 */
export function RootEffects() {
  const pathname = usePathname() ?? "";
  const isWatch = pathname.startsWith("/watch/");
  if (isWatch) return null;
  return (
    <>
      <Ambient />
      <SnowLayerIsland />
    </>
  );
}