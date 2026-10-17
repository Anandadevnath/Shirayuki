import { z } from "zod";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://shirayuki-anime-api-ruby.vercel.app";

export const V2 = "/api/v2/hianime";

interface FetchOpts {
  /** Next revalidate seconds. Use 0 / "no-store" for stream links. */
  revalidate?: number | false;
  tags?: string[];
  noStore?: boolean;
  /** Per-request wall-clock budget (ms). Defaults to the retry timeouts. */
  timeoutMs?: number;
}

/* ── In-flight request deduplication ─────────────────────────────────────────
 * React `cache()` dedupes getter calls WITHIN one server render, but the same
 * upstream URL can still be requested concurrently from different React trees,
 * different route handlers, or two cartesian call sites in the same request
 * before the Data Cache entry is written (a cache stampede). This map collapses
 * those concurrent identical fetches into one network call. It keys on the full
 * URL + cache mode so a `no-store` call (ephemeral stream link) is never served
 * a cached envelope, and it only holds the promise while in flight — nothing
 * persists across requests, so it cannot leak stale data.
 *
 * A Map on the module is per-server-instance (per-lambda on Vercel) which is
 * exactly the scope we want: same-instance bursts dedupe, cross-instance traffic
 * is served by the Next Data Cache just below.
 */
const inflight = new Map<string, Promise<unknown>>();

function dedupeKey(url: string, opts: FetchOpts): string {
  const mode = opts.noStore ? "no-store" : `revalidate:${opts.revalidate ?? "-"}`;
  return `${mode} ${url}`;
}

export async function apiFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  opts: FetchOpts = {},
): Promise<z.infer<T>> {
  const key = dedupeKey(`${API_BASE_URL}${path}`, opts);
  const existing = inflight.get(key);
  if (existing) return existing as Promise<z.infer<T>>;

  const run = doFetch(path, schema, opts).finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}

async function doFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  opts: FetchOpts,
): Promise<z.infer<T>> {
  const url = `${API_BASE_URL}${path}`;
  if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API)
    console.warn(`[api] ${opts.noStore ? "no-store" : "cached"} ${url}`);
  const next: { revalidate?: number | false; tags?: string[] } = {};
  if (opts.revalidate !== undefined) next.revalidate = opts.revalidate;
  if (opts.tags) next.tags = opts.tags;

  const init: RequestInit & { next?: typeof next } = {
    headers: { Accept: "application/json" },
    ...(opts.noStore ? { cache: "no-store" } : { next }),
  };

  // Upstream (hianime.at) is rate-limited/flaky: a slow scrape can stumble over
  // the deadline or come back as a 4xx gate (often 4 0 2 / 429) right after a
  // payment/WAF block. Budget a few spaced retries so a momentary gate doesn't
  // bubble up to safe() and ISR-bake an ErrorState for the whole revalidate
  // window. Timeouts are generous because home/detail scrapes are heavy.
  let lastErr: unknown;
  const attempts = 3;
  const timeouts = [15_000, 15_000, 12_000];
  const backoffs = [400, 900];
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const controller = new AbortController();
      const budget = opts.timeoutMs ?? timeouts[attempt] ?? 12_000;
      const timeout = setTimeout(() => controller.abort(), budget);
      let res: Response;
      try {
        res = await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) {
        // Include a short body snippet so dev logs reveal WHICH layer 4xx'd
        // (e.g. Vercel's "DEPLOYMENT_DISABLED" vs a Hono/upstream message).
        let detail = "";
        try {
          detail = (await res.text()).slice(0, 140).replace(/\s+/g, " ").trim();
        } catch {}
        // A deterministic client error is not a gate: 404 = this id/server
        // simply has nothing (the watch failover loop legitimately walks
        // servers until one answers), 400/401/403 = bad request, not
        // transient. Retrying those 3× only added ~3s of backoff per dead
        // server candidate and multiplied console noise. Only transient
        // failures (timeouts, 402/425/429 gates, 5xx) earn a retry.
        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
          throw new NonRetryError(`HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
        }
        // Respect an explicit Retry-After on 429/503 so we never pile on the
        // gate faster than it asked us to. Capped at 5s so a hostile/large
        // value can't park a render for the whole revalidate window.
        const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
        const gate = new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
        if (retryAfter != null) (gate as Error & { retryAfterMs?: number }).retryAfterMs = retryAfter;
        throw gate;
      }
      const json = await res.json();
      try {
        return schema.parse(json);
      } catch (parseErr) {
        // A schema mismatch is DETERMINISTIC: the same shape will come back on
        // every retry, so hammering the upstream 3× only adds ~1.3s of backoff
        // per bad payload (and multiplies noise). Exit immediately; real
        // transient failures (timeouts, gates, 5xx) never reach this branch.
        if (parseErr instanceof z.ZodError) {
          throw new NonRetryError(
            `schema mismatch: ${parseErr.issues[0]?.message ?? "invalid payload"}`,
          );
        }
        throw parseErr;
      }
    } catch (err) {
      lastErr = err;
      if (err instanceof NonRetryError) throw err.cause ?? err;
      const backoff = backoffs[attempt];
      if (backoff !== undefined) await sleep(backoffDelay(err, backoff));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider fetch failed");
}

/** Retry-After seconds (or HTTP-date) → ms, capped at 5s. Null when absent/invalid. */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const secs = Number(header);
  if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, 5000);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 5000);
  return null;
}

/** Honor a gate's Retry-After when present, else a jittered exponential backoff.
 *  Jitter avoids the thundering-herd rhythm where many parallel requests that
 *  hit the same gate would all retry in lockstep. */
function backoffDelay(err: unknown, baseMs: number): number {
  const hinted = (err as { retryAfterMs?: number } | null)?.retryAfterMs;
  if (typeof hinted === "number") return hinted;
  const jitter = Math.random() * baseMs * 0.5;
  return baseMs + jitter;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wraps a deterministic upstream failure so the retry loop exits without
 *  backoff. `.cause` carries the plain Error message callers expect. */
class NonRetryError extends Error {
  cause: Error;
  constructor(message: string) {
    super(message);
    this.cause = new Error(message);
  }
}
