import { z } from "zod";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://shirayuki-anime-api-ruby.vercel.app";

export const V2 = "/api/v2/hianime";

interface FetchOpts {
  /** Next revalidate seconds. Use 0 / "no-store" for stream links. */
  revalidate?: number | false;
  tags?: string[];
  noStore?: boolean;
}

/**
 * Server-only fetch wrapper: timeout, one retry on network error, Zod-validated.
 * Returns the parsed `data` payload or throws (callers wrap in Result).
 */
export async function apiFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  opts: FetchOpts = {},
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
      const timeout = setTimeout(() => controller.abort(), timeouts[attempt] ?? 12_000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
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
        throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
      }
      const json = await res.json();
      return schema.parse(json);
    } catch (err) {
      lastErr = err;
      if (err instanceof NonRetryError) throw err.cause ?? err;
      const backoff = backoffs[attempt];
      if (backoff !== undefined) await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider fetch failed");
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
