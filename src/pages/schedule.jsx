import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getSchedule } from "@/context/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

/* ==================== SKELETON COMPONENTS ==================== */
function AnimeCardSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 sm:px-6 animate-pulse">
      <Skeleton className="h-5 w-16 sm:w-20 bg-white/10 rounded-lg flex-shrink-0" />
      <Skeleton className="h-5 flex-1 bg-white/10 rounded-lg" />
      <Skeleton className="h-5 w-20 sm:w-28 bg-white/10 rounded-lg flex-shrink-0" />
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-0">
      {[...Array(8)].map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ==================== ANIME ROW COMPONENT ==================== */
function ScheduleAnimeRow({ anime }) {
  const time = anime.time || "--:--";
  
  let episode = null;
  if (anime.episodes?.sub) episode = `Episode ${anime.episodes.sub}`;
  else if (anime.episodes?.dub) episode = `Episode ${anime.episodes.dub}`;
  else if (anime.episode) episode = `Episode ${anime.episode}`;

  return (
    <Link 
      to={`/anime/${anime.id}`} 
      className="block group border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-all duration-300"
    >
      <div className="flex items-center gap-3 sm:gap-4 py-4 px-4 sm:px-6">
        {/* Time Badge */}
        <div className="flex items-center gap-2 min-w-[70px] sm:min-w-[80px] flex-shrink-0">
          <Clock className="h-4 w-4 text-purple-400 hidden sm:block group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.8)] transition-all" />
          <span className="font-bold text-sm sm:text-base text-purple-300 tabular-nums group-hover:text-purple-200 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300">
            {time}
          </span>
        </div>

        {/* Anime Title */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-white truncate group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300">
            {anime.name}
          </p>
        </div>

        {/* Episode Info */}
        {episode && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300 flex-shrink-0">
            <span className="hidden sm:inline">{episode}</span>
            <span className="sm:hidden">EP {anime.episodes?.sub || anime.episodes?.dub || anime.episode}</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ==================== EMPTY STATE COMPONENT ==================== */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
      <div className="glass-container-dark rounded-3xl p-8 sm:p-12 text-center border border-purple-500/20">
        <CalendarIcon className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 text-purple-400" />
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Anime Scheduled</h3>
        <p className="text-sm sm:text-base text-zinc-400">
          There are no anime scheduled for this day
        </p>
      </div>
    </div>
  );
}

/* ==================== MAIN PAGE COMPONENT ==================== */
export default function SchedulePage() {
  // Current time state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // URL params and date selection
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const [selectedDate, setSelectedDate] = useState(
    dateParam ? new Date(dateParam) : new Date()
  );
  const [scheduledAnimes, setScheduledAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ref for scroll container
  const scrollContainerRef = useRef(null);
  const selectedButtonRef = useRef(null);

  // Calculate week days
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch schedule data
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

  // Auto-scroll selected day into view
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedDate]);

  // Handle date change
  const changeDate = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setSearchParams({ date: format(date, "yyyy-MM-dd") });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Section */}
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20 mb-6 sm:mb-8">
          <div className="p-6 sm:p-8">
            {/* Title and Current Time */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Estimated Schedule
              </h1>
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm sm:text-base shadow-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="tabular-nums">
                  (GMT+06:00) {format(now, "M/d/yyyy hh:mm:ss a")}
                </span>
              </div>
            </div>

            {/* Week Day Selector */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Previous Button */}
              <button
                onClick={() => changeDate(subDays(selectedDate, 1))}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl glass-button flex items-center justify-center hover:scale-110 transition-all duration-300"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Day Buttons - Scrollable on mobile without visible scrollbar */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden" 
                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
              >
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex gap-2 sm:gap-3 min-w-max sm:justify-center hide-scrollbar">
                  {weekDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                      <button
                        key={day.toISOString()}
                        ref={isSelected ? selectedButtonRef : null}
                        onClick={() => changeDate(day)}
                        className={`flex flex-col items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 font-bold min-w-[85px] sm:min-w-[115px] ${
                          isSelected
                            ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/60 scale-105 ring-2 ring-purple-400/50"
                            : "glass-button-subtle hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 hover:ring-2 hover:ring-purple-400/30 hover:bg-white/15"
                        }`}
                      >
                        <span className={`text-sm sm:text-base font-bold transition-all duration-300 ${
                          !isSelected ? 'group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,1)]' : ''
                        }`}>
                          {format(day, "EEE")}
                        </span>
                        <span className={`text-xs sm:text-sm font-medium mt-0.5 transition-all duration-300 ${
                          isSelected ? 'opacity-95' : 'opacity-80'
                        }`}>
                          {format(day, "MMM d")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={() => changeDate(addDays(selectedDate, 1))}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl glass-button flex items-center justify-center hover:scale-110 transition-all duration-300"
                aria-label="Next day"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {loading && (
            <div className="p-2">
              <ScheduleSkeleton />
            </div>
          )}

          {!loading && scheduledAnimes.length === 0 && <EmptyState />}

          {!loading && scheduledAnimes.length > 0 && (
            <div className="divide-y divide-white/10">
              {scheduledAnimes.map((anime, index) => (
                <ScheduleAnimeRow key={`${anime.id}-${index}`} anime={anime} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}