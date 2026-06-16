import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-2 shimmer",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="w-[40vw] shrink-0 sm:w-[22vw] md:w-[180px]">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="mt-2 h-3.5 w-3/4" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="py-6">
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
