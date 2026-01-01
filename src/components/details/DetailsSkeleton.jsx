import { Skeleton } from "@/components/ui/skeleton";

export function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background */}
      <div className="relative">
        <Skeleton className="w-full h-[500px] bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-950/80" />
      </div>
      
      <div className="container mx-auto px-4 -mt-[400px] relative z-10">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-48 bg-zinc-800 mb-6" />
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          <Skeleton className="w-[185px] h-[265px] rounded-lg bg-zinc-800 flex-shrink-0" />
          
          {/* Center Content */}
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4 bg-zinc-800" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 bg-zinc-800" />
              <Skeleton className="h-6 w-12 bg-zinc-800" />
              <Skeleton className="h-6 w-16 bg-zinc-800" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32 bg-zinc-800 rounded-full" />
              <Skeleton className="h-12 w-32 bg-zinc-800 rounded-full" />
            </div>
            <Skeleton className="h-24 w-full bg-zinc-800" />
          </div>
          
          {/* Right Sidebar */}
          <div className="w-full lg:w-[280px] space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
