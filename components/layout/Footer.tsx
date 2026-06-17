import Link from "next/link";
import { Snowflake } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[9px] bg-frost-soft text-frost">
            <Snowflake className="size-4" strokeWidth={2.2} />
          </span>
          <div>
            <p className="font-display text-sm font-bold">Sode no Shirayuki</p>
            <p className="text-xs text-faint">Anime, in pure focus.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link href="/category/most-popular" className="hover:text-snow">Popular</Link>
          <Link href="/category/top-airing" className="hover:text-snow">Airing</Link>
          <Link href="/schedule" className="hover:text-snow">Schedule</Link>
          <Link href="/az/all" className="hover:text-snow">Browse</Link>
        </nav>
        <p className="text-xs text-faint">
          For educational/demo use. Content via third-party providers.
        </p>
      </div>
    </footer>
  );
}
