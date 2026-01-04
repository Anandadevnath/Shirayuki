import { Skeleton } from "@/components/ui/skeleton";

export function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background */}
      <div className="relative">
        <Skeleton className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-950/80" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-[200px] sm:-mt-[300px] lg:-mt-[400px] relative z-10">
        {/* Breadcrumb */}
        <Skeleton className="h-3 sm:h-4 w-32 sm:w-48 bg-zinc-800 mb-4 sm:mb-6" />
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Poster */}
          <div className="flex justify-center lg:justify-start">
            <Skeleton className="w-[160px] sm:w-[185px] h-[230px] sm:h-[265px] rounded-lg bg-zinc-800 flex-shrink-0" />
          </div>
          
          {/* Center Content */}
          <div className="flex-1 space-y-3 sm:space-y-4">
            <Skeleton className="h-8 sm:h-10 w-full sm:w-3/4 bg-zinc-800" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 bg-zinc-800 rounded" />
              <Skeleton className="h-5 sm:h-6 w-10 sm:w-12 bg-zinc-800 rounded" />
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 bg-zinc-800 rounded" />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Skeleton className="h-10 sm:h-12 w-28 sm:w-32 bg-zinc-800 rounded-full" />
              <Skeleton className="h-10 sm:h-12 w-28 sm:w-32 bg-zinc-800 rounded-full" />
            </div>
            <Skeleton className="h-20 sm:h-24 w-full bg-zinc-800 rounded" />
          </div>
          
          {/* Right Sidebar - Hidden on mobile, shown on lg+ */}
          <div className="w-full lg:w-[280px] space-y-2 sm:space-y-3 hidden lg:block">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-zinc-800 rounded" />
            ))}
          </div>
        </div>

        {/* Mobile Info Section - Shown only on mobile */}
        <div className="mt-6 space-y-2 lg:hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full bg-zinc-800 rounded" />
          ))}
        </div>

        {/* Related/Characters/Recommended Tabs Section */}
        <div className="mt-8 sm:mt-12">
          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <Skeleton className="h-9 sm:h-10 w-20 sm:w-24 bg-pink-600/30 rounded-lg" />
            <Skeleton className="h-9 sm:h-10 w-24 sm:w-28 bg-zinc-800 rounded-lg" />
            <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 bg-zinc-800 rounded-lg" />
          </div>

          {/* Related Content Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative">
                <Skeleton className="w-full aspect-[2/3] bg-zinc-800 rounded-lg" />
                {/* Number badge */}
                <Skeleton className="absolute top-2 left-2 h-8 w-8 bg-pink-600/50 rounded-full" />
                {/* Type badge */}
                <Skeleton className="absolute top-2 right-2 h-6 w-16 bg-pink-600/50 rounded-md" />
                {/* Sub/Dub badges */}
                <div className="absolute bottom-12 left-2 flex gap-2">
                  <Skeleton className="h-6 w-12 bg-yellow-600/50 rounded" />
                  <Skeleton className="h-6 w-12 bg-blue-600/50 rounded" />
                </div>
                {/* Title */}
                <Skeleton className="absolute bottom-2 left-2 right-2 h-10 bg-zinc-900/80 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Anime Info Card */}
        <div className="mt-8 sm:mt-12 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Info rows */}
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-24 sm:w-32 bg-zinc-800 rounded" />
                  <Skeleton className="h-5 flex-1 bg-zinc-800 rounded" />
                </div>
              ))}
              
              {/* Genres section */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 bg-zinc-800 rounded" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-7 w-20 bg-zinc-800 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Studios section */}
              <div className="flex gap-3">
                <Skeleton className="h-5 w-24 bg-zinc-800 rounded" />
                <Skeleton className="h-5 w-32 bg-pink-600/30 rounded" />
              </div>

              {/* Producers section */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-28 bg-zinc-800 rounded" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-24 bg-pink-600/30 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="mb-8">
          <div className="flex gap-6 border-b border-zinc-800">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 bg-zinc-800 rounded-t" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}