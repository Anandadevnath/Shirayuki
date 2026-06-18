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
        <span className="flex items-center gap-0.5 rounded-sm bg-base/90 px-1 py-px text-[10px] font-semibold text-snow">
          <Captions className="size-2.5 text-frost" /> {sub}
        </span>
      )}
      {!!dub && (
        <span className="flex items-center gap-0.5 rounded-sm bg-base/90 px-1 py-px text-[10px] font-semibold text-snow">
          <Mic className="size-2.5 text-sakura" /> {dub}
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
