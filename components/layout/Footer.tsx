import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { getGenres, safe } from "@/lib/api";

const QUICK_LINKS = [
  { href: "/category/most-popular", label: "Popular" },
  { href: "/category/top-airing", label: "Airing" },
  { href: "/schedule", label: "Schedule" },
  { href: "/az/all", label: "Browse A–Z" },
];

const AZ = ["all", "0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
const azLabel = (l: string) => (l === "all" ? "All" : l.toUpperCase());

const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/dmca", label: "DMCA" },
];

/** Brand-circle social link. */
function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="grid size-9 place-items-center rounded-full glass text-muted transition-all hover:-translate-y-0.5 hover:border-frost/40 hover:text-frost"
    >
      {children}
    </a>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-20 overflow-hidden border-t border-line/70">
      {/* Frost top hairline + ambient bloom behind the brand. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-frost/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-7rem] h-72 w-[60rem] max-w-[92vw] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-frost-deep), transparent)" }}
      />

      <div className="relative mx-auto w-full max-w-[1460px] px-4 py-14 sm:px-6 lg:px-8">
        {/* ── Brand ── */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex translate-x-5 items-center sm:translate-x-8">
            <span className="relative h-20 w-[4.5rem] shrink-0 drop-shadow-[0_6px_24px_rgba(120,180,255,0.25)] sm:h-24 sm:w-20">
              <Image
                src="/logos/shirayuki2.png"
                alt=""
                fill
                sizes="80px"
                className="object-contain"
              />
            </span>
            <span className="relative -ml-6 h-16 w-52 sm:-ml-4 sm:h-20 sm:w-64">
              <Image
                src="/logos/text.png"
                alt="Shirayuki"
                fill
                sizes="256px"
                className="object-contain object-left"
              />
            </span>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-muted">
            Your destination for streaming anime in pure focus — thousands of episodes in HD,
            skip-intro, and continue-watching. No ads.
          </p>

          {/* ── Socials ── */}
          <div className="flex items-center gap-2.5">
            <Social href="https://x.com" label="X (Twitter)">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Social>
            <Social href="https://discord.com" label="Discord">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </Social>
            <Social href="https://reddit.com" label="Reddit">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.973 2.163 2.17 2.163 1.197 0 2.17-.97 2.17-2.163s-.973-2.164-2.17-2.164c-.949 0-1.754.612-2.046 1.459l-4.353-1.02a.481.481 0 0 0-.585.328l-1.654 5.207c-2.766.067-5.265.831-7.105 2.034a2.637 2.637 0 0 0-1.84-.746C1.192 9.134 0 10.32 0 11.779c0 .967.525 1.811 1.302 2.273-.04.262-.06.527-.06.8 0 4.04 4.706 7.327 10.485 7.327s10.485-3.287 10.485-7.327c0-.272-.02-.537-.06-.8.776-.462 1.302-1.306 1.302-2.273zM6.025 13.97c0-1.193.973-2.163 2.17-2.163s2.17.97 2.17 2.163-.973 2.164-2.17 2.164-2.17-.97-2.17-2.164zm9.275 4.494c-.79.79-2.305 1.156-3.3 1.156-.995 0-2.51-.366-3.3-1.156a.48.48 0 0 1 .679-.679c.495.495 1.55.85 2.621.85 1.071 0 2.126-.355 2.621-.85a.48.48 0 0 1 .679.679zm-.135-2.33c-1.197 0-2.17-.97-2.17-2.164s.973-2.163 2.17-2.163 2.17.97 2.17 2.163-.973 2.164-2.17 2.164z" />
              </svg>
            </Social>
            <Social href="https://github.com" label="GitHub">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </Social>
          </div>
        </div>

        {/* ── Quick links ── */}
        <nav className="mt-11 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-frost">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Browse by genre — streamed independently so the static
            footer chrome (links, AZ, socials, legal) ships in the first
            byte and the genre chips paint in via Suspense. ── */}
        <Suspense
          fallback={
            <div className="mt-9 flex flex-wrap justify-center gap-2" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-md bg-surface-2 shimmer" />
              ))}
            </div>
          }
        >
          <FooterGenres />
        </Suspense>
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {AZ.map((l) => (
            <Link
              key={l}
              href={`/az/${l}`}
              className="grid h-8 min-w-8 place-items-center rounded-md border border-line bg-base/40 px-2 text-xs font-semibold text-muted transition-colors hover:border-frost/40 hover:bg-frost-soft hover:text-frost"
            >
              {azLabel(l)}
            </Link>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-11 flex flex-col gap-3 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            © {year} <span className="font-semibold text-muted">Shirayuki</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-frost">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Shirayuki does not store any files on its server. All content is provided by
          non-affiliated third parties. For educational / demo use only.
        </p>
      </div>
    </footer>
  );
}

/**
 * Genre chip row — extracted as a separate async server component so the
 * main Footer (and the rest of the layout above it) doesn't block on the
 * upstream call. Wrapped in <Suspense> in the parent.
 */
async function FooterGenres() {
  const res = await safe(getGenres);
  const genres = res.ok ? res.data : [];
  if (genres.length === 0) return null;
  return (
    <div className="mt-9 flex flex-wrap justify-center gap-2">
      {genres.map((g) => (
        <Link
          key={g.slug}
          href={`/genre/${g.slug}`}
          className="rounded-md border border-line bg-base/40 px-3 py-1.5 text-sm text-muted transition-colors hover:border-frost/40 hover:bg-frost-soft hover:text-frost"
        >
          {g.name}
        </Link>
      ))}
    </div>
  );
}
