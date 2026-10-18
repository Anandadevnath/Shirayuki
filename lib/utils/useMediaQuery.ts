"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query probe. Returns `false` on the server and on the first
 * client render, then the real value on mount — server and client markup stay
 * identical, and the query is subscribed so the value tracks live changes
 * (rotating a phone, plugging in a mouse, resizing across a breakpoint).
 *
 * Companion to `useReducedMotionSSR`; kept separate because the interesting
 * queries here are input-capability ones (`hover`/`pointer`), not the
 * reduced-motion preference.
 */
export function useMediaQuerySSR(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * True only for devices whose primary pointer is a mouse (or trackpad) that
 * can hover. Pointer-tracking effects (card tilt, cursor parallax) must be
 * gated on this: on touch there is no hover to leave, so a tilt would stick
 * wherever the last tap landed.
 */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/** Convenience wrapper for the capability check above. */
export function useFinePointer(): boolean {
  return useMediaQuerySSR(FINE_POINTER_QUERY);
}
