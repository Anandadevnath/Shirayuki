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
    <section className="laser-frame glass flex flex-col rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-gradient-frost font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            Top 10
          </h2>
          <span className="hidden h-px w-12 bg-gradient-to-r from-frost/60 to-transparent sm:block" />
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm font-semibold">
          {available.map((p) => (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={cn(
                "relative pb-0.5 transition-colors",
                active === p.key ? "text-frost" : "text-muted hover:text-snow",
              )}
            >
              {p.label}
              {active === p.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-frost" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {items.map((a, idx) => (
          <RankRow key={`${a.id}-${idx}`} anime={a} rank={a.rank ?? idx + 1} />
        ))}
      </div>
    </section>
  );
}
