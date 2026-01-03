import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getSchedule } from "@/context/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

/* -------------------- Skeleton -------------------- */
function AnimeCardSkeleton() {
  return (
    <div className="flex items-center border-b border-white/5 py-4 px-2 w-full animate-pulse">
      {/* Time column (bold, fixed width) */}
      <div className="w-24 text-left font-bold text-lg text-zinc-300 mr-4">
        <Skeleton className="h-6 w-16 bg-zinc-800 rounded" />
      </div>
      {/* Title column (flex-grow) */}
      <div className="flex-1 font-semibold text-white text-base truncate mr-4">
        <Skeleton className="h-6 w-full bg-zinc-800 rounded" />
      </div>
      {/* Episode column (right aligned, fixed width) */}
      <div className="w-40 text-right text-zinc-400 text-sm flex items-center justify-end gap-2">
        <Skeleton className="h-5 w-24 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

/* -------------------- Anime Card -------------------- */
function ScheduleAnimeRow({ anime }) {
  const time = anime.time || "--:--";
  let episode = null;
  if (anime.episodes?.sub) episode = `Episode ${anime.episodes.sub}`;
  else if (anime.episodes?.dub) episode = `Episode ${anime.episodes.dub}`;
  else if (anime.episode) episode = `Episode ${anime.episode}`;

  return (
    <Link to={`/anime/${anime.id}`} className="block group w-full">
      <div className="flex items-center border-b border-white/5 py-4 px-2 w-full transition">
        <div className="w-24 text-left font-bold text-lg text-zinc-300 tabular-nums group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-colors">
          {time}
        </div>
        <div className="flex-1 font-semibold text-white text-base truncate group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-colors">
          {anime.name}
        </div>
        {episode && (
          <div className="w-40 text-right text-zinc-400 text-sm flex items-center justify-end gap-2 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-colors">
            <span className="inline-block">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="inline align-middle"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>{episode}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* -------------------- Page -------------------- */
export default function SchedulePage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const [selectedDate, setSelectedDate] = useState(
    dateParam ? new Date(dateParam) : new Date()
  );
  const [scheduledAnimes, setScheduledAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const { data } = await getSchedule(formattedDate);
      setScheduledAnimes(data?.data?.scheduledAnimes || []);
      setLoading(false);
    }
    fetchSchedule();
  }, [selectedDate]);

  const changeDate = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setSearchParams({ date: format(date, "yyyy-MM-dd") });
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Footer-style background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-black" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header and Date Controls */}
      <div className="relative z-10 px-6 mt-12 pt-6 pb-2 rounded-2xl bg-black/60 backdrop-blur-2xl shadow-2xl mx-auto max-w-7xl border border-white/10">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-300 text-center">Estimated Schedule</h1>
          <span className="inline-block rounded-full bg-white text-black text-base font-semibold px-4 py-1 shadow-md text-center">
            (GMT+06:00) {format(now, "M/d/yyyy hh:mm:ss a")}
          </span>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2 w-full overflow-x-auto pb-2">
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-md border-2 border-white/80"
            onClick={() => changeDate(subDays(selectedDate, 1))}
            aria-label="Previous week"
          >
            <ChevronLeft />
          </button>
          {weekDays.map((day, idx) => (
            <button
              key={day.toISOString()}
              onClick={() => changeDate(day)}
              className={`flex flex-col items-center justify-center px-7 py-5 rounded-2xl transition-all font-bold min-w-[140px] shadow-sm focus:outline-none ${isSameDay(day, selectedDate)
                  ? "bg-purple-300 text-black scale-105"
                  : "bg-white/10 text-white hover:bg-purple-400/20"
                }`}
            >
              <span className="text-lg">{format(day, "EEE")}</span>
              <span className="text-base font-normal mt-1">{format(day, "MMM d")}</span>
            </button>
          ))}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-md border-2 border-white/80"
            onClick={() => changeDate(addDays(selectedDate, 1))}
            aria-label="Next week"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto relative z-10 py-10">
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && scheduledAnimes.length === 0 && (
          <div className="py-24 text-center text-zinc-500">
            <CalendarIcon className="mx-auto mb-4 h-14 w-14" />
            <p>No anime scheduled for this day</p>
          </div>
        )}

        {!loading && scheduledAnimes.length > 0 && (
          <div className="rounded-2xl overflow-hidden bg-black/30 border border-white/5 divide-y divide-white/5 shadow-xl mx-auto max-w-[1480px] px-3 sm:px-6 lg:px-12">
            {scheduledAnimes.map((anime) => (
              <ScheduleAnimeRow key={anime.id} anime={anime} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}