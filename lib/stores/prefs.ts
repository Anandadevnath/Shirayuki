"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Prefs {
  category: "sub" | "dub";
  serverId: string | null;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  autoPlayNext: boolean;
  /** Attempt to start playback automatically when an episode opens. Distinct
   *  from `autoPlayNext` (which advances at the END of an episode). Honours
   *  browser autoplay policy — a rejected play() is swallowed, never retried. */
  autoPlay: boolean;
  captions: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  set: (p: Partial<Omit<Prefs, "set">>) => void;
}

/** Remembered player preferences — the "it remembers me" differentiator. */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      category: "sub",
      serverId: null,
      autoSkipIntro: true,
      autoSkipOutro: true,
      autoPlayNext: true,
      autoPlay: false,
      captions: true,
      volume: 1,
      muted: false,
      rate: 1,
      set: (p) => set(p),
    }),
    { name: "shirayuki:prefs" },
  ),
);
