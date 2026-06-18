"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Star,
} from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";
import { EpBadges } from "@/components/anime/Badges";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The minimal card shape the local index needs — kept narrow so the index
 * route can stay tiny and the fuzzy match stays fast in memory.
 */
type IndexEntry = Pick<
  AnimeCardModel,
  "id" | "title" | "jname" | "poster" | "type" | "episodes" | "score"
>;

/** Module-level cache so the index is fetched at most once per page load
 *  and is reused across palette open/close cycles. */
let indexPromise: Promise<IndexEntry[]> | null = null;
let indexEntries: IndexEntry[] | null = null;

function loadIndex(): Promise<IndexEntry[]> {
  if (indexEntries) return Promise.resolve(indexEntries);
  if (indexPromise) return indexPromise;
  indexPromise = fetch("/api/search-index")
    .then((r) => r.json() as Promise<{ results: IndexEntry[] }>)
    .then((j) => {
      indexEntries = j.results ?? [];
      return indexEntries;
    })
    .catch(() => {
      indexEntries = [];
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

/** Pre-warm the local index — call from Nav on mount so the first ⌘K is instant. */
export function prefetchSearchIndex() {
  void loadIndex();
}

interface IndexedHit {
  entry: IndexEntry;
  /** Higher = better. Used to sort local results. */
  score: number;
}

/**
 * Tokenize the query into lowercase terms; each term must match somewhere in
 * the title or jname. Scoring: exact > startsWith > word-boundary > substring.
 * Runs synchronously over ~80 entries — sub-millisecond.
 */
function searchLocal(entries: IndexEntry[], raw: string, limit = 8): IndexedHit[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: IndexedHit[] = [];

  for (const e of entries) {
    const title = (e.title ?? "").toLowerCase();
    const jname = (e.jname ?? "").toLowerCase();
    let score = 0;
    let allMatched = true;

    for (const t of terms) {
      // Prefer title matches; jname matches count half.
      let bestTerm = 0;
      if (title === t) bestTerm = 1000;
      else if (title.startsWith(t)) bestTerm = 500;
      else if (new RegExp(`\\b${escapeRegex(t)}`).test(title)) bestTerm = 250;
      else if (title.includes(t)) bestTerm = 100;
      else if (jname && jname.includes(t)) bestTerm = 40;
      if (bestTerm === 0) {
        allMatched = false;
        break;
      }
      score += bestTerm;
    }

    if (allMatched && score > 0) {
      // Mild score boost for higher-scored anime — popular first when tied.
      if (typeof e.score === "number") score += Math.min(e.score, 20);
      hits.push({ entry: e, score });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [localResults, setLocalResults] = useState<IndexEntry[]>([]);
  const [netResults, setNetResults] = useState<AnimeCardModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [indexReady, setIndexReady] = useState(indexEntries != null);
  const netCache = useRef(new Map<string, AnimeCardModel[]>());
  const networkSeq = useRef(0);

  // Reset state on open, focus the input, ensure local index is loaded.
  useEffect(() => {
    if (open) {
      setQ("");
      setLocalResults([]);
      setNetResults([]);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      // If the prefetch hasn't finished yet, wait for it. Otherwise no-op.
      loadIndex().then((entries) => {
        setIndexReady(true);
        setLocalResults(entries.slice(0, 6));
      });
    }
  }, [open]);

  // Instant local search on every keystroke (synchronous, sub-ms over ~80).
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!indexEntries || !term) {
      // Show featured picks when empty — first 6 of the local index.
      setLocalResults(indexEntries ? indexEntries.slice(0, 6) : []);
      return;
    }
    setLocalResults(searchLocal(indexEntries, term).map((h) => h.entry));
    setActive(0);
  }, [q, open]);

  // Debounced network suggest — broader catalogue, cached per-query.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setNetResults([]);
      setLoading(false);
      return;
    }
    // Cache hit → instant.
    const cached = netCache.current.get(term);
    if (cached) {
      setNetResults(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    const seq = ++networkSeq.current;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const json = (await res.json()) as { results: AnimeCardModel[] };
        if (seq !== networkSeq.current) return; // stale
        const results = json.results ?? [];
        netCache.current.set(term, results);
        setNetResults(results);
        setActive(0);
      } catch {
        /* aborted or offline — silently ignore */
      } finally {
        if (seq === networkSeq.current) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  // Merge: local first, then any network-only results not already in local.
  const merged = useMemo(() => {
    const seen = new Set(localResults.map((r) => r.id));
    const extra = netResults.filter((r) => !seen.has(r.id));
    return [...localResults, ...extra].slice(0, 10);
  }, [localResults, netResults]);

  function go(id: string) {
    onOpenChange(false);
    router.push(`/anime/${id}`);
  }

  function submitSearch() {
    const term = q.trim();
    if (!term) return;
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onOpenChange(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, merged.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (merged[active]) go(merged[active].id);
      else submitSearch();
    }
  }

  const empty = q.trim().length === 0;
  const trimmed = q.trim();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop — heavier frost + slow fade so the panel feels cinematic. */}
      <button
        className="absolute inset-0 cursor-default bg-base/75 backdrop-blur-md"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel — laser-frame gives the moving frost comet edges (same identity
          as the home glass panels), glass gives the frosted body. */}
      <div className="laser-frame glass relative w-full max-w-xl overflow-hidden rounded-xl shadow-[var(--shadow-frost)]">
        {/* Input row */}
        <div className="relative flex items-center gap-2.5 px-4">
          <Search
            className={cn(
              "size-4 shrink-0 transition-colors",
              trimmed ? "text-frost" : "text-faint",
            )}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search anime…"
            className="h-11 w-full bg-transparent text-sm text-snow outline-none placeholder:text-faint/80"
            aria-label="Search anime"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <FrostDots />}
          {!loading && trimmed && (
            <kbd className="hidden rounded border border-line/80 bg-surface-2/60 px-1.5 py-0.5 font-mono text-[10px] text-faint sm:inline">
              ↵
            </kbd>
          )}
        </div>

        {/* Animated focus underline — a frost bar that slides in under the
            input when the user types. Pure transform/opacity, GPU-only. */}
        <div className="relative h-px overflow-hidden">
          <div className="h-px bg-line/60" />
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-4 top-0 h-px origin-left bg-gradient-to-r from-transparent via-frost to-transparent transition-transform duration-500 ease-out",
              trimmed ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
            )}
          />
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto p-1.5 scroll-frost">
          {/* Empty state — only when there is no query AND the local index
              hasn't been replaced by something useful. */}
          {empty && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Sparkles className="size-4 text-frost/70" />
              <p className="text-xs text-muted">
                Start typing to summon results.
              </p>
              {!indexReady && (
                <p className="text-[11px] text-faint">Warming the catalogue…</p>
              )}
            </div>
          )}

          {!empty && merged.length === 0 && !loading && indexReady && (
            <p className="px-3 py-6 text-center text-xs text-faint">
              No matches.{" "}
              <button
                onClick={submitSearch}
                className="text-frost underline-offset-4 hover:underline"
              >
                Search the full catalogue →
              </button>
            </p>
          )}

          <ul className="flex flex-col gap-0.5">
            {merged.map((r, i) => (
              <li key={r.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 py-1.5 text-left transition-colors",
                    i === active
                      ? "bg-frost-soft/70"
                      : "hover:bg-surface-2/70",
                  )}
                >
                  {/* Active left-edge frost beam — slides in via transform-only. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-1 left-0 w-[2px] origin-top rounded-full bg-gradient-to-b from-frost via-frost-deep to-transparent transition-transform duration-300 ease-out",
                      i === active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                    )}
                  />
                  <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-surface-2 ring-1 ring-line/60">
                    {r.poster && (
                      <Image
                        src={r.poster}
                        alt=""
                        fill
                        sizes="28px"
                        className={cn(
                          "object-cover transition-transform duration-300 ease-out",
                          i === active ? "scale-105" : "scale-100",
                        )}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] font-semibold leading-tight transition-colors",
                        i === active ? "text-frost" : "text-snow",
                      )}
                    >
                      {highlight(r.title, trimmed)}
                    </span>
                    {r.jname && (
                      <span className="block truncate text-[11px] leading-tight text-faint">
                        {highlight(r.jname, trimmed)}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {typeof r.score === "number" && (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-snow/90">
                        <Star className="size-3 fill-warning text-warning" />
                        {r.score}
                      </span>
                    )}
                    <EpBadges sub={r.episodes.sub} dub={r.episodes.dub} />
                    {r.type && (
                      <span className="rounded border border-line/80 bg-surface-2/60 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-faint">
                        {r.type}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer hints — kbd chips + "see all" */}
        <div className="flex items-center justify-between gap-2 border-t border-line/60 bg-base/30 px-3 py-1.5 text-[10px] text-faint backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <KbdChip Icon={ArrowUp} />
            <KbdChip Icon={ArrowDown} />
            <span>navigate</span>
            <span className="mx-1 h-3 w-px bg-line/60" />
            <KbdChip Icon={CornerDownLeft} />
            <span>open</span>
            <span className="mx-1 h-3 w-px bg-line/60" />
            <span className="rounded border border-line/80 bg-surface-2/60 px-1 py-px font-mono text-[9px]">
              esc
            </span>
            <span>close</span>
          </div>
          <button
            onClick={submitSearch}
            className="rounded-full border border-frost/30 bg-frost-soft px-2.5 py-0.5 text-[10px] font-semibold text-frost transition-colors hover:border-frost/60 hover:bg-frost-soft/80"
          >
            See all results for “{trimmed || "…"}”
          </button>
        </div>
      </div>
    </div>
  );
}

function KbdChip({ Icon }: { Icon: typeof ArrowUp }) {
  return (
    <span className="grid size-5 place-items-center rounded border border-line/80 bg-surface-2/60 text-faint">
      <Icon className="size-3" />
    </span>
  );
}

/** Three frost dots that pulse in sequence — a quiet "thinking" indicator. */
function FrostDots() {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1.5 rounded-full bg-frost/80"
          style={{
            animation: "shimmer-dot 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </span>
  );
}

/** Wrap matched characters in <mark> for a subtle highlight inside result titles. */
function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const safe = escapeRegex(q);
  const parts = text.split(new RegExp(`(${safe})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="rounded-sm bg-frost/20 px-0.5 text-frost"
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}