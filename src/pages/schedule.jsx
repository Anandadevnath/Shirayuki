import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getSchedule } from "@/context/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Play, Captions, Mic, CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";

function AnimeCardSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="flex gap-4 p-4">
        <Skeleton className="w-20 h-28 rounded bg-zinc-800 flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2 bg-zinc-800" />
          <Skeleton className="h-4 w-1/2 mb-2 bg-zinc-800" />
          <Skeleton className="h-4 w-1/3 bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}

function ScheduleAnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`}>
      <Card className="group bg-zinc-900 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all duration-300 cursor-pointer">
        <div className="flex gap-4 p-4">
          <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden">
            <img
              src={anime.poster}
              alt={anime.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
              {anime.name}
            </h3>
            {anime.jname && anime.jname !== anime.name && (
              <p className="text-zinc-500 text-sm line-clamp-1 mt-1">{anime.jname}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {anime.time && (
                <div className="flex items-center gap-1 text-zinc-400 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{anime.time}</span>
                </div>
              )}
              
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                {anime.type}
              </Badge>
              
              <div className="flex gap-1">
                {anime.episodes?.sub && (
                  <div className="flex items-center gap-1 bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded">
                    <Captions className="h-3 w-3" />
                    {anime.episodes.sub}
                  </div>
                )}
                {anime.episodes?.dub && (
                  <div className="flex items-center gap-1 bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded">
                    <Mic className="h-3 w-3" />
                    {anime.episodes.dub}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) {
      return new Date(dateParam);
    }
    return new Date();
  });
  
  const [scheduledAnimes, setScheduledAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get week days for navigation
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      setError(null);
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const { data, error: err } = await getSchedule(formattedDate);
      
      if (err) {
        setError(err);
      } else if (data?.data) {
        setScheduledAnimes(data.data.scheduledAnimes || []);
      }
      
      setLoading(false);
    }
    
    fetchSchedule();
  }, [selectedDate]);

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
      setSearchParams({ date: format(date, "yyyy-MM-dd") });
    }
  };

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    handleDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    handleDateChange(newDate);
  };

  const goToToday = () => {
    handleDateChange(new Date());
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Anime Schedule</h1>
          <p className="text-zinc-400">See what anime is airing on any date</p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="sticky top-16 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          {/* Week View */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 flex gap-1 overflow-x-auto pb-2">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateChange(day)}
                  className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-center transition-colors ${
                    isSameDay(day, selectedDate)
                      ? "bg-purple-600 text-white"
                      : isToday(day)
                      ? "bg-zinc-800 text-purple-400 border border-purple-500"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-medium">{format(day, "EEE")}</div>
                  <div className="text-lg font-bold">{format(day, "d")}</div>
                </button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Picker & Today Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "MMMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                    className="bg-zinc-900"
                  />
                </PopoverContent>
              </Popover>
              
              {!isToday(selectedDate) && (
                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  Today
                </Button>
              )}
            </div>
            
            <p className="text-zinc-500 text-sm">
              {scheduledAnimes.length} anime scheduled
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Schedule</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && scheduledAnimes.length === 0 && (
          <div className="text-center py-20">
            <CalendarIcon className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-zinc-400 mb-2">No Anime Scheduled</h2>
            <p className="text-zinc-500">
              No anime is scheduled for {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
        )}

        {/* Schedule Grid */}
        {!loading && !error && scheduledAnimes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledAnimes.map((anime) => (
              <ScheduleAnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
