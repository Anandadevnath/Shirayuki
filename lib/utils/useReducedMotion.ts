"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe reduced-motion probe — replaces `useReducedMotion` from framer-motion.
 * Reads once on mount and subscribes to media-query changes; the same default
 * (false) is used during SSR so server and client markup never diverge.
 *
 * Used by animated surfaces (Trending marquee, Latest Episodes coverflow)
 * that need to short-circuit their motion path under prefers-reduced-motion.
 */
export function useReducedMotionSSR(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}