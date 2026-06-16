"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";

export function Rail({
  title,
  items,
  href,
}: {
  title: string;
  items: AnimeCardModel[];
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="relative py-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="text-sm text-muted transition-colors hover:text-frost">
              See all
            </Link>
          )}
          <div className="hidden gap-1 sm:flex">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="grid size-8 place-items-center rounded-sm border border-line text-muted transition-colors hover:border-frost/40 hover:text-snow"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="grid size-8 place-items-center rounded-sm border border-line text-muted transition-colors hover:border-frost/40 hover:text-snow"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar snap-x-rail flex gap-3 overflow-x-auto scroll-pl-1 pb-1"
      >
        {items.map((a) => (
          <AnimeCard
            key={`${a.id}-${a.episodeNumber ?? ""}`}
            anime={a}
            className="w-[40vw] shrink-0 sm:w-[22vw] md:w-[180px]"
          />
        ))}
      </div>
    </section>
  );
}
