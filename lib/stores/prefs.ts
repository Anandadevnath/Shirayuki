"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Prefs {
  category: "sub" | "dub";
  serverId: string | null;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  autoPlayNext: boolean;
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
      captions: true,
      volume: 1,
      muted: false,
      rate: 1,
      set: (p) => set(p),
    }),
    { name: "shirayuki:prefs" },
  ),
);
