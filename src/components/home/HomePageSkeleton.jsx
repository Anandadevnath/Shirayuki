import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <>
      {/* Spotlight Skeleton */}
      <div className="relative w-full h-[500px] sm:h-[600px] lg:h-[730px] -mt-20 overflow-hidden">
        <Skeleton className="w-full h-full bg-zinc-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center pb-12 sm:pb-24 max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12">
          <Skeleton className="h-8 sm:h-10 lg:h-12 w-[90%] max-w-[500px] mb-4 bg-zinc-700" />
          <div className="flex gap-2 sm:gap-3 mb-4">
            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 bg-zinc-700 rounded-full" />
            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 bg-zinc-700 rounded-full" />
          </div>
          <Skeleton className="h-3 sm:h-4 w-[95%] max-w-[600px] mb-2 bg-zinc-700" />
          <Skeleton className="h-3 sm:h-4 w-[85%] max-w-[500px] mb-2 bg-zinc-700" />
          <Skeleton className="h-3 sm:h-4 w-[75%] max-w-[400px] mb-4 sm:mb-6 bg-zinc-700" />
          <Skeleton className="h-10 sm:h-12 w-28 sm:w-36 bg-zinc-700 rounded-lg" />
        </div>
      </div>

      {/* Rest of content */}
      <div className="relative -mt-32 sm:-mt-44 lg:-mt-56 z-10 max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
        {/* Trending Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4 bg-zinc-800" />
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[180px] lg:w-[200px] flex-shrink-0">
                <Skeleton className="h-[210px] sm:h-[270px] lg:h-[300px] w-full bg-zinc-800 rounded-xl sm:rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Airing Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-6 sm:h-8 w-32 sm:w-40 mb-4 bg-zinc-800" />
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[180px] lg:w-[200px] flex-shrink-0">
                <Skeleton className="h-[210px] sm:h-[270px] lg:h-[300px] w-full bg-zinc-800 rounded-xl sm:rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Episodes + Sidebar Skeleton */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 bg-zinc-800" />
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-[200px] sm:h-[240px] lg:h-[280px] w-full bg-zinc-800 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800">
                <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
                  <Skeleton className="flex-1 h-8 bg-zinc-700 rounded-md" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md mx-1" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full bg-zinc-800 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Upcoming + Top 10 Skeleton */}
        <div className="mt-8">
          <div className="flex gap-6 items-center mb-4">
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 bg-zinc-800" />
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-[200px] sm:h-[240px] lg:h-[280px] w-full bg-zinc-800 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="w-[380px] flex-shrink-0 hidden lg:block">
              <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800">
                <div className="flex bg-zinc-800/80 rounded-lg p-1 mb-4">
                  <Skeleton className="flex-1 h-8 bg-zinc-700 rounded-md" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md mx-1" />
                  <Skeleton className="flex-1 h-8 bg-zinc-800 rounded-md" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full bg-zinc-800 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Genres Skeleton */}
        <div className="mt-8 mb-8">
          <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mb-4 bg-zinc-800" />
          <div className="flex flex-wrap gap-2">
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="h-6 sm:h-7 w-16 sm:w-20 bg-zinc-800 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}