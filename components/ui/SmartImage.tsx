"use client";

import Image, { type ImageProps } from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * next/image with a built-in blur-up whose crossfade is LOAD-DRIVEN, not
 * timer-driven: a frost shimmer sits on top in the exact same box until the
 * bitmap has actually decoded, then shimmer and image cross-fade in the same
 * window. On slow networks the placeholder stays up for as long as it takes —
 * the box never shows an empty hole. Broken URLs flip to a static frosted
 * surface instead of an endlessly looping shimmer.
 *
 * Why client: `onLoad`/`onError` are needed to key the crossfade to the real
 * decode event (CSS animations alone run on a timer and would fade the
 * placeholder out before a slow bitmap arrives). The component stays tiny —
 * no effects beyond one cached-completeness check — so hydrating dozens of
 * instances is cheap, and the SSR markup is identical for server parents.
 *
 * Load paths:
 *  - Network: img mounts bare (under the shimmer), `onLoad` fires → shimmer
 *    gets `.shimmer-stack` (crossfades out) and the img gets `.image-stack`
 *    (fades + settles) in the same commit — one coordinated entrance.
 *  - Already cached when React hydrates: `onLoad` will never fire for an
 *    <img> that completed before hydration, so `useLayoutEffect` (pre-paint)
 *    checks `img.complete && naturalWidth > 0` and marks the cached path —
 *    the shimmer is dropped WITHOUT re-fading the already-painted bitmap
 *    (that re-fade was the refresh flicker: cached images must not replay
 *    entrance animations, see requirement: no repeated animations).
 *  - Broken URL: `onError` (or a complete-but-zero-size cache hit) → static
 *    `bg-surface-2` surface, image removed from view. No infinite shimmer.
 *
 * Drop-in for <Image fill> usages — the wrapper is `absolute inset-0` so it
 * fills a positioned parent just like a bare `fill` image did.
 */
type LoadState =
  | "loading" // bitmap not decoded — shimmer placeholder on top
  | "ready" // decoded via network this session — coordinated crossfade
  | "cached" // already painted pre-hydration — drop shimmer, no re-fade
  | "error"; // broken URL — static frosted surface fallback

export function SmartImage({
  className,
  wrapperClassName,
  onLoad,
  onError,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const ref = useRef<HTMLImageElement>(null);

  // Cached-at-hydration path. useLayoutEffect so the state flips BEFORE the
  // first client paint — the placeholder is dropped and no re-fade plays.
  useLayoutEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0 && state === "loading") {
      setState("cached");
    } else if (img.complete && img.naturalWidth === 0 && state === "loading") {
      // complete with no intrinsic size = failed decode (broken/cancelled).
      setState("error");
    }
    // `state` intentionally excluded: this check runs once at hydration;
    // later loads are covered by onLoad/onError.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span aria-hidden className={cn("absolute inset-0 overflow-hidden", wrapperClassName)}>
      <Image
        {...props}
        ref={ref}
        // Crossfade only for a network decode this session; a cached bitmap is
        // already painted under the shimmer and must not replay an entrance.
        className={cn(
          state === "ready" && "image-stack",
          state === "error" && "opacity-0",
          className,
        )}
        onLoad={(e) => {
          onLoad?.(e);
          setState((s) => (s === "loading" ? "ready" : s));
        }}
        onError={(e) => {
          onError?.(e);
          setState((s) => (s === "error" ? s : "error"));
        }}
      />
      {/* Placeholder ON TOP of the img (later sibling, both absolute) so a
          bitmap that decodes before React hydrates can never flash uncovered.
          - loading: persistent shimmer
          - ready:   one-shot crossfade out, synced with the img's fade-in
          - cached:  removed immediately (pre-paint)
          - error:   static frosted surface — no infinite loop */}
      {state === "loading" && (
        <span className="absolute inset-0 bg-surface-2 shimmer-loop" />
      )}
      {state === "ready" && (
        <span className="shimmer-stack absolute inset-0 bg-surface-2 shimmer" />
      )}
      {state === "error" && (
        <span className="absolute inset-0 bg-surface-2" />
      )}
    </span>
  );
}
