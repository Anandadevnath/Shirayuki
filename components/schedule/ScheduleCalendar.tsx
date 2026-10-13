import Link from "next/link";
import type { ScheduleItem, ScheduleWeekday } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { TypePill } from "@/components/anime/Badges";

/**
 * Shared release-calendar pieces. Used by both the full /schedule page and the
 * home page section so the two stay visually identical without duplicating
 * markup. Schedule items carry premiere-derived fields only — never broadcast
 * times (upstream exposes none) — so a row shows title + type + premiere date.
 */

/** "2026-11-30" → "Nov 30, 2026". Parsed as UTC so the local timezone never
 *  shifts the displayed day (the API emits a bare premiere date). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Compact poster-thumb row: thumbnail, title, type pill + premiere date. */
export function ScheduleItemRow({
  it,
  showComing = false,
}: {
  it: ScheduleItem;
  /** Render the "Coming" chip (used where the whole list is upcoming). */
  showComing?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/anime/${it.id}`}
        className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-2"
      >
        <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-2">
          {it.poster && <SmartImage src={it.poster} alt="" fill sizes="48px" className="object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium text-snow group-hover:text-frost">
            {it.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <TypePill type={it.type} />
            {it.premiereDate ? (
              <span className="font-mono text-[11px] font-semibold text-frost">
                {formatDate(it.premiereDate)}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-faint">Date TBD</span>
            )}
          </span>
        </span>
        {showComing && it.isUpcoming && (
          <span className="hidden shrink-0 rounded-full bg-frost-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-frost sm:inline">
            Coming
          </span>
        )}
      </Link>
    </li>
  );
}

/** A single day column in the weekly calendar (glass panel + poster rows).
 *  Returns null for empty buckets so callers can skip them automatically. */
export function ScheduleDayColumn({ day, items }: ScheduleWeekday) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-line/70 bg-surface/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-display text-base font-bold text-snow">{day}</h3>
        <span className="rounded-full bg-frost-soft px-2 py-0.5 text-[10px] font-bold text-frost">
          {items.length}
        </span>
      </div>
      <ul className="-mx-2 flex flex-col gap-0.5">
        {items.map((it) => (
          <ScheduleItemRow key={it.id} it={it} showComing />
        ))}
      </ul>
    </section>
  );
}
