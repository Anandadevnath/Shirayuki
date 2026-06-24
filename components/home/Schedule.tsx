"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Play, CalendarDays, ChevronDown } from "lucide-react";
import type { ScheduleItem } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

export type ScheduleDay = {
  iso: string;
  label: string; // weekday — "Thu"
  day: number; // 18
  month: string; // "Jun"
};

/** A live-updating date/time pill — mirrors the reference's clock chip.
 *  Updates via direct DOM mutation (textContent) so React never re-renders
 *  the Schedule panel on every tick. */
function LiveClock() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="flex items-center gap-2 rounded-full border border-line glass px-4 py-2 font-mono text-xs text-snow tabular-nums sm:text-sm">
      <Clock className="size-3.5 text-frost" />
      {/* textContent is updated imperatively above; SSR/hydration stays
          deterministic with this placeholder. */}
      <span ref={ref} className="min-w-[9.5rem]">—</span>
    </span>
  );
}



/**
 * "Estimated Schedule" — a cinematic glass panel for the home page. A frost-lit
 * week strip drives a per-day broadcast list; all 7 days are server-rendered
 * up front so tab switches are instant (no HTTP hop, no spinner). Pure frost
 * palette to sit with the rest of the board.
 */
export function Schedule({
  days,
  initialByDay,
  initialIso,
}: {
  days: ScheduleDay[];
  initialByDay: Record<string, ScheduleItem[]>;
  initialIso: string;
}) {
  const COLLAPSED = 8;
  const [selected, setSelected] = useState(initialIso);
  const [expanded, setExpanded] = useState(false);
  // All 7 days are pre-fetched server-side — pure local switch, no HTTP.
  const cache = useRef<Map<string, ScheduleItem[]>>(
    new Map(Object.entries(initialByDay)),
  );
  const [items, setItems] = useState<ScheduleItem[]>(initialByDay[initialIso] ?? []);

  const select = useCallback((iso: string) => {
    setSelected(iso);
    setExpanded(false); // each day reopens collapsed
    const cached = cache.current.get(iso);
    setItems(cached ?? []);
  }, []);

  if (!days.length) return null;

  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-2xl glass p-5 sm:p-7">
        {/* Ambient corner glow — soft frost depth in the panel's top-right. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-frost/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-frost/40 to-transparent"
        />

        {/* ── Header: frost tick + eyebrow/title, live clock on the right ── */}
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-frost to-frost-deep shadow-[var(--shadow-neon)]" />
            <div className="min-w-0">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-frost">
                <CalendarDays className="size-3.5" /> Season Radar
              </span>
              <h2 className="text-gradient-frost font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                Estimated Schedule
              </h2>
            </div>
          </div>
          <LiveClock />
        </div>

        {/* ── Day strip ── */}
        <div
          role="tablist"
          aria-label="Broadcast day"
          className="no-scrollbar relative mb-6 flex gap-2.5 overflow-x-auto pb-1"
        >
          {days.map((d) => {
            const active = d.iso === selected;
            return (
              <button
                key={d.iso}
                role="tab"
                type="button"
                onClick={() => select(d.iso)}
                aria-selected={active}
                aria-controls={`schedule-panel-${d.iso}`}
                tabIndex={active ? 0 : -1}
                className={cn(
                  "group relative flex min-w-[6.5rem] shrink-0 flex-col items-center gap-0.5 rounded-md border px-4 py-3 transition-colors duration-300",
                  active
                    ? "border-frost/50 bg-frost-soft text-frost"
                    : "border-line/70 text-muted hover:border-frost/40 hover:text-snow",
                )}
              >
                <span className="text-sm font-bold capitalize">{d.label}</span>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    active ? "text-frost/80" : "text-faint",
                  )}
                >
                  {d.day} {d.month}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Broadcast list ── */}
        <div
          id={`schedule-panel-${selected}`}
          role="tabpanel"
          aria-label={`Broadcasts on ${selected}`}
          className="relative min-h-[14rem]"
        >
          {items.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <CalendarDays className="mb-3 size-8 text-faint" />
              <p className="text-sm font-medium text-muted">No broadcasts scheduled</p>
              <p className="mt-1 text-xs text-faint">Nothing airing on this day.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/40">
              {(expanded ? items : items.slice(0, COLLAPSED)).map((item) => (
                <li key={`${item.id}-${item.episodeNumber}`}>
                  <Link
                    href={`/anime/${item.id}`}
                    className="group -mx-2 flex items-center gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-surface-2/40"
                  >
                    {/* Time — frost mono, with a tick that lights on hover */}
                    <span className="flex items-center gap-2.5">
                      <span className="h-7 w-px shrink-0 bg-line transition-colors duration-300 group-hover:bg-frost" />
                      <span className="w-12 shrink-0 font-mono text-sm font-semibold tabular-nums text-frost">
                        {item.time ?? "—"}
                      </span>
                    </span>

                    <span className="line-clamp-1 flex-1 text-sm font-semibold text-snow transition-colors group-hover:text-frost sm:text-[15px]">
                      {item.title}
                    </span>

                    {item.episodeNumber != null && (
                      <span className="flex shrink-0 items-center gap-2 text-sm text-muted transition-colors group-hover:text-snow">
                        <span className="grid size-6 place-items-center rounded-full bg-frost-soft text-frost transition-transform duration-300 group-hover:scale-110">
                          <Play className="size-3 translate-x-px fill-current" />
                        </span>
                        <span className="hidden font-medium sm:inline">
                          Episode {item.episodeNumber}
                        </span>
                        <span className="font-medium sm:hidden">EP {item.episodeNumber}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* View more / less — only when a day has more than the collapsed count */}
          {items.length > COLLAPSED && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="group inline-flex items-center gap-2 rounded-full border border-line glass px-5 py-2 text-sm font-semibold text-muted transition-colors hover:border-frost/40 hover:text-frost"
              >
                {expanded ? "View less" : `View ${items.length - COLLAPSED} more`}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-300",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}