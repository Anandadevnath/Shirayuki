"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, CornerDownLeft, Loader2 } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AnimeCardModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const json = (await res.json()) as { results: AnimeCardModel[] };
        setResults(json.results ?? []);
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

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
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].id);
      else submitSearch();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        className="absolute inset-0 cursor-default bg-base/70 backdrop-blur-sm"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <div className="glass relative w-full max-w-xl overflow-hidden rounded-lg shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search anime…"
            className="h-14 w-full bg-transparent text-base text-snow outline-none placeholder:text-faint"
            aria-label="Search anime"
            autoComplete="off"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-faint" />}
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && q.trim().length >= 2 && !loading && (
            <p className="px-3 py-6 text-center text-sm text-faint">No results — fresh snow.</p>
          )}
          {results.length === 0 && q.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-sm text-faint">
              Type to search the catalogue.
            </p>
          )}
          <ul>
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    i === active ? "bg-frost-soft" : "hover:bg-surface-2",
                  )}
                >
                  <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-surface-2">
                    {r.poster && (
                      <Image src={r.poster} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-snow">{r.title}</span>
                    {r.jname && (
                      <span className="block truncate text-xs text-faint">{r.jname}</span>
                    )}
                  </span>
                  {r.type && (
                    <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">
                      {r.type}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-faint">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="size-3" /> to open
          </span>
          <button onClick={submitSearch} className="hover:text-snow">
            See all results for “{q.trim() || "…"}”
          </button>
        </div>
      </div>
    </div>
  );
}
