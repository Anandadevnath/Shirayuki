"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { AnimeCard } from "./AnimeCard";

export function Rail({
  title,
  eyebrow,
  items,
  href,
}: {
  title: string;
  eyebrow?: string;
  items: AnimeCardModel[];
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <SectionHeader title={title} eyebrow={eyebrow} href={href}>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </SectionHeader>

      <div
        ref={ref}
        className="no-scrollbar snap-x-rail flex gap-4 overflow-x-auto scroll-pl-1 px-1 pb-4 pt-3"
      >
        {items.map((a) => (
          <AnimeCard
            key={`${a.id}-${a.episodeNumber ?? ""}`}
            anime={a}
            className="w-[44vw] shrink-0 sm:w-[24vw] md:w-[200px]"
          />
        ))}
      </div>
    </section>
  );
}
