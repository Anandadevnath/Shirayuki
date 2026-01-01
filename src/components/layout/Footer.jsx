import { useState, useEffect, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { getHome } from "@/context/api";

// Constants
const ALPHABET = ["All", "0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const MAX_VISIBLE_GENRES = 24;

const SOCIAL_LINKS = [
  { name: "Twitter", href: "#", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { name: "Discord", href: "#", path: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" },
  { name: "Reddit", href: "#", path: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
  { name: "GitHub", href: "#", path: "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" },
];

const QUICK_LINKS = [
  { name: "Home", href: "/" },
  { name: "Types", href: "/category" },
  { name: "Schedule", href: "/schedule" },
  { name: "A-Z List", href: "/az-list" },
  { name: "Studios", href: "/producer" },
];

const BOTTOM_LINKS = [
  { name: "Terms", href: "/terms" },
  { name: "Privacy", href: "/privacy" },
  { name: "DMCA", href: "/dmca" },
];

// Reusable Components
const SectionTitle = memo(({ children }) => (
  <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
    {children}
  </h3>
));

const SocialIcon = memo(({ path }) => (
  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d={path} />
  </svg>
));

const GlassButton = memo(({ children, className = "" }) => (
  <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-zinc-400 bg-white/5 backdrop-blur-sm border border-white/10 rounded-md sm:rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-300 ${className}`}>
    {children}
  </span>
));

export default function Footer() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchGenres() {
      const { data: result } = await getHome();
      if (isMounted && result?.data?.genres) {
        setGenres(result.data.genres);
      }
    }
    fetchGenres();

    return () => { isMounted = false; };
  }, []);

  const getGenreUrl = useCallback((genre) =>
    `/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`, []);

  const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
  const remainingCount = genres.length - MAX_VISIBLE_GENRES;

  return (
    <footer className="relative mt-10 sm:mt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-black" />
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-4">
              <Link to="/" className="flex -mt-6 sm:-mt-10 items-center">
                <img src="/shirayuki2.png" alt="Shirayuki Logo" className="h-20 sm:h-28 w-auto object-contain" />
                <img src="/text.png" alt="Shirayuki" className="h-16 sm:h-24 w-auto object-contain" />
              </Link>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Your ultimate destination for streaming anime. Watch thousands of episodes in HD quality with no ads.
              </p>

              {/* Social Links */}
              <div className="flex gap-2 sm:gap-3">
                {SOCIAL_LINKS.map(({ name, href, path }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-zinc-400 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-400 transition-all duration-300"
                    title={name}
                  >
                    <SocialIcon path={path} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <SectionTitle>Quick Links</SectionTitle>
              <ul className="space-y-2 sm:space-y-3">
                {QUICK_LINKS.map(({ name, href }) => (
                  <li key={name}>
                    <Link
                      to={href}
                      className="text-zinc-400 hover:text-white text-xs sm:text-sm transition-colors hover:translate-x-1 inline-block"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Genres */}
            <div className="lg:col-span-6">
              <SectionTitle>Genres</SectionTitle>
              {visibleGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-3">
                  {visibleGenres.map((genre) => (
                    <Link key={genre} to={getGenreUrl(genre)}>
                      <GlassButton>{genre}</GlassButton>
                    </Link>
                  ))}
                  {remainingCount > 0 && (
                    <Link to="/genre" className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-zinc-400 bg-white/5 backdrop-blur-sm border border-white/10 rounded-md sm:rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-300">
                      +{remainingCount} more
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* A-Z List Section */}
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  A-Z List
                </h3>
                <span className="text-zinc-500 text-xs sm:text-sm hidden sm:inline">
                  Browse anime alphabetically
                </span>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <Link to="/request" className="text-xs sm:text-sm text-zinc-400 hover:text-purple-400 transition-colors">
                  Request Anime
                </Link>
                <Link to="/contact" className="text-xs sm:text-sm text-zinc-400 hover:text-purple-400 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {ALPHABET.map((letter) => (
                <Link
                  key={letter}
                  to={`/az-list/${letter.toLowerCase()}`}
                  className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm font-medium text-zinc-400 bg-white/5 border border-white/10 rounded-md sm:rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-300"
                >
                  {letter}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-medium">
                    © 2026 Shirayuki.
                  </span>
                  <span className="text-zinc-500"> All Rights Reserved.</span>
                </p>
                <p className="text-zinc-600 text-[10px] sm:text-xs">
                  This site does not store any files on its server. All contents are provided by non-affiliated third parties.
                </p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                {BOTTOM_LINKS.map(({ name, href }) => (
                  <Link
                    key={name}
                    to={href}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
