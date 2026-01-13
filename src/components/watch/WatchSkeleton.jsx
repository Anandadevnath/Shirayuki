import { Skeleton } from "@/components/ui/skeleton";

function WatchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-[#0a0a0f] to-pink-950/20 pointer-events-none"></div>
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      {/* Player + Sidebar */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Player Section */}
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Video Player */}
          <Skeleton className="aspect-video bg-white/5 backdrop-blur-xl" />
          {/* Player Controls */}
          <div className="flex flex-col gap-3 px-6 py-4 bg-black/30 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-xl bg-white/5" />
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
              </div>
            </div>
            <div className="px-2 pt-2 border-t border-white/10">
              <Skeleton className="h-6 w-32 rounded bg-white/5 mb-2" />
              <Skeleton className="h-4 w-48 rounded bg-white/5" />
            </div>
          </div>
          {/* Server Selection Skeleton */}
          <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 backdrop-blur-xl border-t border-white/10">
            <div className="flex-1 flex flex-col gap-3">
              {/* SUB Servers Skeleton */}
              <div className="flex items-start gap-3 flex-wrap">
                <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                </div>
              </div>
              {/* DUB Servers Skeleton */}
              <div className="flex items-start gap-3 flex-wrap">
                <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                  <Skeleton className="h-10 w-20 rounded-xl bg-white/5" />
                </div>
              </div>
            </div>
            {/* Info Box Skeleton */}
            <Skeleton className="h-32 w-full md:w-[240px] rounded-xl bg-white/5" />
          </div>
        </div>
        {/* Episodes Sidebar Skeleton */}
        <div className="glass-container rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col" style={{height: '885px'}}>
          <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <Skeleton className="h-6 w-24 rounded bg-white/5" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-32 rounded-full bg-white/5" />
                <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-3 space-y-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl bg-white/5 w-full" />
            ))}
          </div>
        </div>
      </div>
      {/* Anime Details Section Skeleton */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 pt-8 pb-12">
        <div className="glass-container rounded-3xl overflow-hidden shadow-2xl border border-white/20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster Skeleton */}
            <Skeleton className="w-full md:w-[240px] h-[340px] rounded-2xl bg-white/5 flex-shrink-0" />
            {/* Details Skeleton */}
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64 rounded bg-white/5" />
              <Skeleton className="h-24 w-full rounded bg-white/5" />
              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded bg-white/5" />
                    <Skeleton className="h-5 w-32 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
            {/* Rating Skeleton */}
            <div className="md:w-[280px] flex-shrink-0">
              <Skeleton className="h-full w-full rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchSkeleton;
