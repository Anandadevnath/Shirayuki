import { RailSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="aspect-[16/10] w-full rounded-xl sm:aspect-[16/7]" />
      <RailSkeleton />
      <RailSkeleton />
    </div>
  );
}
