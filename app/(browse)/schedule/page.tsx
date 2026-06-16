import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getSchedule, safe } from "@/lib/api";
import { EmptyState, ErrorState } from "@/components/common/States";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Schedule" };

/** Build a 7-day window centered on the given date (UTC, deterministic). */
function weekAround(dateISO: string) {
  const base = new Date(`${dateISO}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + (i - 3));
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      day: d.getUTCDate(),
    };
  });
}

type SP = { searchParams: Promise<{ date?: string }> };

export default async function SchedulePage({ searchParams }: SP) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selected = date ?? today;
  const week = weekAround(selected);
  const res = await safe(() => getSchedule(selected));

  return (
    <div className="pt-4">
      <p className="text-sm text-frost">Season Radar</p>
      <h1 className="mb-6 mt-1 text-2xl font-bold">Airing Schedule</h1>

      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1">
        {week.map((d) => (
          <Link
            key={d.iso}
            href={`/schedule?date=${d.iso}`}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-md border px-4 py-2 transition-colors",
              d.iso === selected
                ? "border-frost/50 bg-frost-soft text-frost"
                : "border-line text-muted hover:text-snow",
            )}
          >
            <span className="text-xs">{d.label}</span>
            <span className="text-lg font-bold">{d.day}</span>
          </Link>
        ))}
      </div>

      {!res.ok ? (
        <ErrorState retryHref="/schedule" />
      ) : !res.data.length ? (
        <EmptyState title="No broadcasts" message="Nothing scheduled for this day." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {res.data.map((item) => (
            <li key={`${item.id}-${item.episodeNumber}`}>
              <Link
                href={`/anime/${item.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="flex items-center gap-1.5 font-mono text-sm text-frost">
                  <Clock className="size-3.5" /> {item.time ?? "—"}
                </span>
                <span className="line-clamp-1 flex-1 text-sm text-snow">{item.title}</span>
                {item.episodeNumber != null && (
                  <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    EP {item.episodeNumber}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
