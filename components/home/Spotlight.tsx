"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import type { SpotlightModel } from "@/lib/providers/types";
import { EpBadges } from "@/components/anime/Badges";
import { truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function Spotlight({ items }: { items: SpotlightModel[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    if (!n || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (!n) return null;
  const a = items[i];

  return (
    <section
      className="relative overflow-hidden rounded-xl ring-1 ring-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Spotlight"
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/7]">
        {a.poster && (
          <Image
            src={a.poster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end gap-3 p-5 sm:max-w-[60%] sm:p-10">
          {typeof a.rank === "number" && (
            <span className="font-mono text-xs text-frost">#{a.rank} Spotlight</span>
          )}
          <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            {a.title}
          </h1>
          {a.jname && <p className="-mt-1 text-sm text-muted">{a.jname}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {a.type && <span className="rounded-sm border border-line px-2 py-0.5">{a.type}</span>}
            {a.quality && (
              <span className="rounded-sm bg-frost-soft px-2 py-0.5 text-frost">{a.quality}</span>
            )}
            <EpBadges sub={a.episodes.sub} dub={a.episodes.dub} />
          </div>
          {a.description && (
            <p className="hidden max-w-xl text-sm text-muted sm:line-clamp-3">
              {truncate(a.description, 240)}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3">
            <Link
              href={`/watch/${a.id}`}
              className="flex items-center gap-2 rounded-sm bg-frost px-5 py-2.5 text-sm font-semibold text-base transition-transform hover:scale-[1.03]"
            >
              <Play className="size-4 fill-current" /> Watch
            </Link>
            <Link
              href={`/anime/${a.id}`}
              className="flex items-center gap-2 rounded-sm border border-line bg-surface/60 px-5 py-2.5 text-sm font-semibold text-snow transition-colors hover:border-frost/40"
            >
              <Info className="size-4" /> Details
            </Link>
          </div>
        </div>

        <button
          onClick={() => setI((p) => (p - 1 + n) % n)}
          aria-label="Previous"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full glass p-2 text-snow sm:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => setI((p) => (p + 1) % n)}
          aria-label="Next"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full glass p-2 text-snow sm:grid"
        >
          <ChevronRight className="size-5" />
        </button>

        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === i ? "w-6 bg-frost" : "w-1.5 bg-snow/40 hover:bg-snow/70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
