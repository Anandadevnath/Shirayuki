"use client";

import { useMemo, useState } from "react";
import type { Top10Buckets } from "@/lib/providers/types";
import { RankRow } from "./RankList";
import { TabBar, useTabIndicator } from "@/components/common/TabIndicator";
import { cn } from "@/lib/utils/cn";

const PERIODS = [
  { key: "day", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

/** Top 10 glass panel with Today/Week/Month tabs. Every period always shows;
 *  an empty period gets a friendly placeholder instead of vanishing, so the
 *  "Today" tab is never missing even when the upstream returns no day list. */
export function Top10Tabs({ buckets }: { buckets: Top10Buckets }) {
  const counts = useMemo(
    () =>
      PERIODS.map((p) => ({ ...p, count: buckets[p.key]?.length ?? 0 })),
    [buckets],
  );
  const [active, setActive] = useState<PeriodKey>(
    counts.find((c) => c.count > 0)?.key ?? "day",
  );

  const items = buckets[active] ?? [];

  // Gliding indicator — measured from the real tab buttons so the bar
  // travels between labels instead of fading per tab.
  const { bindTrack, bindBtn, barStyle } = useTabIndicator(active);

  return (
    <section className="laser-frame laser-live glass flex flex-col rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-gradient-frost font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            Top 10
          </h2>
          <span className="hidden h-px w-12 bg-gradient-to-r from-frost/60 to-transparent sm:block" />
        </div>
        <div
          ref={bindTrack}
          role="tablist"
          aria-label="Top 10 period"
          className="relative flex shrink-0 items-center gap-4 text-sm font-semibold"
        >
          {counts.map((p) => (
            <button
              key={p.key}
              ref={bindBtn(p.key)}
              role="tab"
              type="button"
              aria-selected={active === p.key}
              aria-controls={`top10-panel-${p.key}`}
              tabIndex={active === p.key ? 0 : -1}
              onClick={() => setActive(p.key)}
              className={cn(
                "relative pb-0.5 transition-colors duration-200",
                active === p.key ? "text-frost" : "text-muted hover:text-snow",
              )}
            >
              {p.label}
            </button>
          ))}
          <TabBar barStyle={barStyle} />
        </div>
      </div>
      <div
        id={`top10-panel-${active}`}
        role="tabpanel"
        aria-label={`Top 10 ${active}`}
        className="mt-3 flex flex-col gap-1"
      >
        {/* key by period → a short settle on swap; height stays data-driven
            (no fixed panel height) and reduced-motion flattens the motion */}
        <div key={active} className="tab-swap flex flex-col gap-1">
          {items.length > 0 ? (
            items.map((a) => <RankRow key={a.id} anime={a} />)
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              Nothing ranked yet — check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}