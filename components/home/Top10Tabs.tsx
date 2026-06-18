"use client";

import { useMemo, useState } from "react";
import type { Top10Buckets } from "@/lib/providers/types";
import { RankRow } from "./RankList";
import { cn } from "@/lib/utils/cn";

const PERIODS = [
  { key: "day", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

/** Top 10 glass panel with Day/Week/Month tabs. Only non-empty periods show. */
export function Top10Tabs({ buckets }: { buckets: Top10Buckets }) {
  const available = useMemo(
    () => PERIODS.filter((p) => buckets[p.key]?.length > 0),
    [buckets],
  );
  const [active, setActive] = useState<PeriodKey | null>(available[0]?.key ?? null);

  if (!available.length || !active) return null;
  const items = buckets[active] ?? [];

  return (
    <section className="glass flex h-full flex-col rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-gradient-frost font-display text-xl font-extrabold sm:text-2xl">
          Top 10
        </h2>
        <div className="flex shrink-0 gap-1 rounded-full border border-line bg-base/40 p-0.5">
          {available.map((p) => (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                active === p.key
                  ? "bg-frost-soft text-frost"
                  : "text-muted hover:text-snow",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 divide-y divide-line/40 border-t border-line/40">
        {items.map((a, idx) => (
          <RankRow key={`${a.id}-${idx}`} anime={a} rank={a.rank ?? idx + 1} />
        ))}
      </div>
    </section>
  );
}
