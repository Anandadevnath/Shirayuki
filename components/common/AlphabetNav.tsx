"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { AZ_LETTERS, azLabel } from "@/lib/utils/format";

/**
 * A–Z letter strip for the browse catalogue. Renders the same segment list as
 * the footer (`AZ_LETTERS`) as real `/az/{letter}` `Link`s and highlights the
 * segment currently in the path.
 *
 * Note: the upstream `azlist` endpoint ignores the letter and returns the same
 * popularity-sorted catalogue for every segment, so these are honest browse
 * entry points, not filters — the page lede says so. The links intentionally
 * carry no `?page=`, so switching letters resets to page 1.
 *
 * `usePathname` can be `null` outside a mounted router; guard it like `Nav.tsx`.
 */
export function AlphabetNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const active = pathname.startsWith("/az/")
    ? decodeURIComponent(pathname.slice("/az/".length).split("/")[0] ?? "")
    : "";

  const base =
    "grid h-8 flex-1 min-w-8 place-items-center rounded-md border px-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost";

  return (
    <nav
      aria-label="Browse A–Z"
      className={cn("no-scrollbar -mx-1 flex w-full gap-1.5 overflow-x-auto px-1 pb-1", className)}
    >
      {AZ_LETTERS.map((letter) => {
        const isActive = letter === active;
        return (
          <Link
            key={letter}
            href={`/az/${letter}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={`Browse titles starting with ${azLabel(letter)}`}
            className={cn(
              base,
              isActive
                ? "border-frost/50 bg-frost-soft text-frost"
                : "border-line bg-base/40 text-muted hover:border-frost/40 hover:bg-frost-soft hover:text-frost",
            )}
          >
            {azLabel(letter)}
          </Link>
        );
      })}
    </nav>
  );
}
