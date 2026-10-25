"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { AZ_LETTERS, azLabel } from "@/lib/utils/format";

/**
 * A–Z letter strip for the browse catalogue. Renders the segment list
 * (`AZ_LETTERS`: "All", "0–9", A–Z) as real `/az/{letter}` `Link`s and
 * highlights the segment currently in the path.
 *
 * Note: the upstream `azlist` endpoint ignores the letter and returns the same
 * popularity-sorted catalogue for every segment, so these are honest browse
 * entry points, not filters — the page lede says so. The links intentionally
 * carry no `?page=`, so switching letters resets to page 1.
 *
 * Layout: a single horizontally-scrollable row of uniform pills (min 2rem, the
 * "All"/"0–9" labels grow to fit). Hidden scrollbar; borders, radius and the
 * cyan active state all come from the shared tokens so the strip matches the
 * discovery controls. `usePathname` can be `null` outside a mounted router.
 */
export function AlphabetNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const active = pathname.startsWith("/az/")
    ? decodeURIComponent(pathname.slice("/az/".length).split("/")[0] ?? "")
    : "";

  const base =
    "grid h-9 min-w-9 place-items-center rounded-[var(--radius-btn)] border px-2.5 text-xs font-semibold tabular-nums transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost";

  return (
    <nav
      aria-label="Browse A–Z"
      className={cn(
        "no-scrollbar -mx-1 flex w-full items-center gap-1.5 overflow-x-auto px-1 py-0.5",
        className,
      )}
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
              "shrink-0",
              isActive
                ? "border-frost/60 bg-frost-soft text-frost shadow-[0_0_0_1px_rgba(103,232,232,0.25)_inset]"
                : "border-line bg-base/40 text-muted hover:border-frost/40 hover:bg-frost-soft/60 hover:text-frost",
            )}
          >
            {azLabel(letter)}
          </Link>
        );
      })}
    </nav>
  );
}
