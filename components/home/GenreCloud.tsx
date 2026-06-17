import Link from "next/link";
import type { GenreModel } from "@/lib/providers/types";

/** Frosted chip cloud of all genres. */
export function GenreCloud({ genres }: { genres: GenreModel[] }) {
  if (!genres?.length) return null;

  return (
    <section className="glass rounded-lg p-4 sm:p-5">
      <h2 className="mb-3 text-base font-bold sm:text-lg">Browse by Genre</h2>
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <Link
            key={g.slug}
            href={`/genre/${g.slug}`}
            className="rounded-sm border border-line bg-base/40 px-3 py-1.5 text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-frost/40 hover:bg-frost-soft hover:text-frost"
          >
            {g.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
