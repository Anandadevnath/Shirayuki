import { cn } from "@/lib/utils/cn";
import { Captions, Mic } from "lucide-react";

export function EpBadges({
  sub,
  dub,
  className,
}: {
  sub?: number | null;
  dub?: number | null;
  className?: string;
}) {
  if (!sub && !dub) return null;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!!sub && (
        <span className="flex items-center gap-1 rounded-sm bg-base/80 px-1.5 py-0.5 text-[10px] font-semibold text-snow backdrop-blur-sm">
          <Captions className="size-3 text-frost" /> {sub}
        </span>
      )}
      {!!dub && (
        <span className="flex items-center gap-1 rounded-sm bg-base/80 px-1.5 py-0.5 text-[10px] font-semibold text-snow backdrop-blur-sm">
          <Mic className="size-3 text-sakura" /> {dub}
        </span>
      )}
    </div>
  );
}

export function TypePill({ type }: { type?: string | null }) {
  if (!type) return null;
  return (
    <span className="rounded-sm border border-line bg-surface/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
      {type}
    </span>
  );
}
