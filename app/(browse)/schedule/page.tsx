import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { getSchedule, safe } from "@/lib/api";
import type { AnimeCardModel, ScheduleItem } from "@/lib/providers/types";
import { Grid } from "@/components/anime/Grid";
import { ErrorState } from "@/components/common/States";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ScheduleDayColumn, ScheduleItemRow } from "@/components/schedule/ScheduleCalendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Weekly release calendar, upcoming premieres and currently airing anime.",
};

/** Schedule items reuse the poster-card model so the existing Grid renders
 *  them with zero customisation (cards need `episodes`; schedule items omit it). */
function toCard(it: ScheduleItem): AnimeCardModel {
  return {
    id: it.id,
    title: it.title,
    jname: it.jname,
    poster: it.poster,
    type: it.type,
    episodes: { sub: null, dub: null },
    score: null,
    rank: null,
    airingTime: null,
    episodeNumber: null,
  };
}

export default async function SchedulePage() {
  const res = await safe(getSchedule);

  if (!res.ok) {
    return (
      <div className="pt-10">
        <ErrorState retryHref="/schedule" />
      </div>
    );
  }

  const s = res.data;
  const hasWeek = s.week.some((b) => b.items.length > 0);
  const hasUpcoming = s.upcoming.length > 0;
  const hasAiring = s.airing.length > 0;

  if (!hasWeek && !hasUpcoming && !hasAiring) {
    return (
      <div className="pt-10">
        <ErrorState
          retryHref="/schedule"
          message="No schedule data could be fetched right now — the provider may not have published any for this season."
        />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <header className="mb-8 flex flex-col gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-frost">
          <CalendarDays className="size-3.5" /> Release Calendar
        </span>
        <h1 className="font-display text-3xl font-extrabold leading-tight">Schedule</h1>
        <p className="max-w-2xl text-sm text-muted">
          Weekday-premiere calendar for announced titles, an up-next list and the currently
          airing crop — derived from HiAnime listing data (no broadcast times are published
          upstream, so the calendar shows premiere days only).
          {s.updatedAt && (
            <span className="mt-1 block font-mono text-[11px] text-faint">
              Updated {new Date(s.updatedAt).toLocaleString()}
            </span>
          )}
        </p>
      </header>

      {hasWeek && (
        <section className="mb-12">
          <SectionHeader eyebrow="Weekly" title="Premieres by weekday" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.week.map((b) => (
              <ScheduleDayColumn key={b.day} day={b.day} items={b.items} />
            ))}
          </div>
        </section>
      )}

      {hasUpcoming && (
        <section className="mb-12">
          <SectionHeader eyebrow="Up next" title="Upcoming premieres" />
          <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
            <ul className="-mx-2 flex flex-col gap-0.5">
              {s.upcoming.map((it) => (
                <ScheduleItemRow key={it.id} it={it} showComing />
              ))}
            </ul>
          </div>
        </section>
      )}

      {hasAiring && (
        <section className="mb-6">
          {/* Airing titles have no weekday upstream (their Aired window has
              started), so they read as a poster grid rather than calendar
              rows — same card language as the rest of the site. */}
          <SectionHeader
            eyebrow="Now airing"
            title="Currently airing"
            href="/category/top-airing"
            seeAllLabel="More"
          />
          <Grid items={s.airing.map(toCard)} />
        </section>
      )}
    </div>
  );
}

