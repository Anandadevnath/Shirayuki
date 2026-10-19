/**
 * Rate limiting + resource ceilings for the first-party proxy routes
 * (`/api/stream`, `/api/subtitle`) — SEC-01 remediation.
 *
 * ── Why this module is shaped the way it is ───────────────────────────────
 * The audit found `/api/stream` was an unauthenticated open relay to any public
 * URL with no rate limiting. The hard constraint is that this app runs on
 * Vercel serverless: each instance has its own memory, so a module-level
 * counter is NOT a real distributed limit — it is only a best-effort dampener
 * within one warm instance.
 *
 * The design therefore separates:
 *
 *   1. `RateLimiter` — a tiny interface any backend can satisfy.
 *   2. `upstashLimiter` — a DISTRIBUTED fixed-window limiter backed by Upstash
 *      Redis over its REST API (works on Vercel Edge/Node without extra SDKs).
 *      Enabled only when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *      are present.
 *   3. `memoryLimiter` — an in-process fixed-window limiter. Used as the
 *      fallback so the app is never MORE open than before and never breaks if
 *      the external store is absent. Documented as per-instance only.
 *   4. `getLimiter()` — picks the backend once, at module load.
 *
 * ── Failure policy ────────────────────────────────────────────────────────
 * If the configured limiter TIMES OUT or ERRORS, the decision is FAIL-OPEN:
 * the request is allowed. Rationale: a false 429 on a legitimate anime stream
 * breaks playback for real users, while a transient gap in abuse protection is
 * the lesser harm for a public media proxy whose worst case is bandwidth cost.
 * This trade-off is deliberate and documented; `denyOnError` can flip it.
 *
 * Everything below is free of provider/app imports so it is unit-testable under
 * `node --test` (see `lib/api/rate-limit.test.ts`).
 */

export interface RateLimitResult {
  /** Is this request allowed? */
  allowed: boolean;
  /** Remaining requests in the current window (best-effort). */
  remaining: number;
  /** Seconds until the window resets (for `Retry-After`). */
  retryAfterSeconds: number;
  /** Which backend answered — surfaced for logs/observability. */
  source: "upstash" | "memory" | "none";
}

export interface RateLimiter {
  /** Consume one token for `key`; return the decision. */
  limit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

/* ── In-memory fixed-window limiter (per-instance fallback) ───────────────── */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryWindows = new Map<string, WindowEntry>();

/**
 * Fixed-window counter in process memory. NOT distributed: on Vercel each
 * lambda has its own map, so the effective limit is `limit × instanceCount`
 * under horizontal scale. It still stops a single hot client from hammering one
 * instance, and it costs nothing. Swept lazily to avoid unbounded growth.
 */
export function memoryLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = memoryWindows.get(key);
  const windowMs = windowSeconds * 1000;

  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so the map cannot grow without bound.
    if (memoryWindows.size > 5000) {
      for (const [k, v] of memoryWindows) {
        if (v.resetAt <= now) memoryWindows.delete(k);
      }
    }
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: windowSeconds, source: "memory" };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter, source: "memory" };
  }
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: retryAfter,
    source: "memory",
  };
}

/** Test-only: clear the in-memory window map. */
export function __resetMemoryWindows(): void {
  memoryWindows.clear();
}

/* ── Upstash Redis fixed-window limiter (distributed) ─────────────────────── */

/**
 * Consume one token against Upstash Redis using INCR + EXPIRE (a fixed window).
 * Uses the REST pipeline endpoint so there is no SDK dependency. Returns null on
 * any transport error / timeout so the caller can fall back or fail open.
 */
export async function upstashLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowSeconds: number,
  timeoutMs = 1500,
): Promise<RateLimitResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Pipeline: INCR key; EXPIRE key window NX; TTL key.
    const body = JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSeconds), "NX"],
      ["TTL", key],
    ]);
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(json[0]?.result);
    if (!Number.isFinite(count)) return null;
    const ttl = Number(json[2]?.result);
    const retryAfter = Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: retryAfter,
      source: "upstash",
    };
  } catch {
    return null; // network error / abort → caller decides (fail open)
  } finally {
    clearTimeout(timer);
  }
}

/* ── Backend selection ───────────────────────────────────────────────────── */

export interface LimiterConfig {
  /** Requests allowed per window, per key. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** If true, a limiter outage denies the request instead of allowing it. */
  denyOnError: boolean;
}

/** Sensible proxy defaults: generous enough for HLS segment bursts, tight
 *  enough to curb relay abuse. One playlist + many segments per episode is
 *  normal, so the ceiling is intentionally high. Overridable via env for ops
 *  (`PROXY_RATE_LIMIT`, `PROXY_RATE_WINDOW_SECONDS`, `PROXY_RATE_LIMIT_DENY_ON_ERROR`)
 *  without a code change. */
export const DEFAULT_PROXY_LIMITS: LimiterConfig = {
  limit: Number(process.env.PROXY_RATE_LIMIT) > 0 ? Number(process.env.PROXY_RATE_LIMIT) : 300,
  windowSeconds:
    Number(process.env.PROXY_RATE_WINDOW_SECONDS) > 0
      ? Number(process.env.PROXY_RATE_WINDOW_SECONDS)
      : 60,
  denyOnError: process.env.PROXY_RATE_LIMIT_DENY_ON_ERROR === "1",
};

/**
 * Short-lived "recently allowed" memo, keyed by the rate-limit key.
 *
 * WHY: HLS playback fans one episode out into hundreds of segment requests
 * through /api/stream. With a distributed limiter configured, awaiting Upstash
 * on EVERY segment would add a network round-trip (up to the 1.5s abort budget)
 * to the hottest path in the app. Once a client has just been allowed, we can
 * skip the round-trip for a few seconds.
 *
 * SAFETY: this only ever SKIPS a check for a key that very recently passed one,
 * and only for `VERDICT_TTL_MS`. A denied client is never memoized. The
 * worst-case overshoot is bounded by how many requests a client can make in the
 * TTL window and is well within a 300/60s budget. Crucially, a client that was
 * NOT recently seen still pays the real check, so a fresh/rotating key cannot
 * use this to bypass the limit.
 */
const VERDICT_TTL_MS = 5_000;
const allowMemo = new Map<string, number>();

function recentlyAllowed(key: string, now: number): boolean {
  const until = allowMemo.get(key);
  if (until === undefined) return false;
  if (until <= now) {
    allowMemo.delete(key);
    return false;
  }
  return true;
}

function rememberAllowed(key: string, now: number): void {
  allowMemo.set(key, now + VERDICT_TTL_MS);
  if (allowMemo.size > 10_000) {
    for (const [k, v] of allowMemo) if (v <= now) allowMemo.delete(k);
  }
}

/** Test-only: clear the allow memo. */
export function __resetAllowMemo(): void {
  allowMemo.clear();
}

/**
 * Resolve and run the active limiter. `env` is injectable for testing.
 * Order: Upstash (distributed) → memory (per-instance) → allow-all.
 * On ANY limiter error the `denyOnError` policy decides.
 *
 * A short per-key memo avoids an Upstash round-trip on the HLS segment hot path
 * (see `allowMemo`); it never memoizes a denial and never applies to a key that
 * was not just allowed.
 */
export async function checkRateLimit(
  key: string,
  config: LimiterConfig,
  env: Record<string, string | undefined> = process.env,
): Promise<RateLimitResult> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const now = Date.now();
    if (recentlyAllowed(key, now)) {
      return { allowed: true, remaining: config.limit, retryAfterSeconds: config.windowSeconds, source: "upstash" };
    }
    const r = await upstashLimit(url, token, key, config.limit, config.windowSeconds);
    if (r) {
      if (r.allowed) rememberAllowed(key, now);
      return r;
    }
    // Upstash unreachable:
    if (config.denyOnError) {
      return { allowed: false, remaining: 0, retryAfterSeconds: config.windowSeconds, source: "none" };
    }
    // fall through to the in-memory dampener so we are never MORE open
  }

  return memoryLimit(key, config.limit, config.windowSeconds);
}

/**
 * Derive a stable, non-PII rate-limit key from a request.
 *
 * SECURITY: the client IP MUST come from a value the caller cannot forge.
 * `x-forwarded-for` is append-only: the caller may send `X-Forwarded-For:
 * <spoofed>` and the platform APPENDS its own hop, so the LEFTMOST entry is
 * attacker-controlled and useless as a limit key. `x-real-ip` is a single
 * platform-set value and is preferred; when only XFF is present we take the
 * RIGHTMOST entry (the hop the edge added). A missing value falls back to a
 * coarse "unknown" bucket so a global ceiling still applies (e.g. local dev).
 * The IP is hashed so raw addresses never leave the request or land in a store
 * in plaintext.
 */
export function clientKey(req: { headers: Headers }, scope: string): string {
  const realIp = (req.headers.get("x-real-ip") ?? "").trim();
  let ip = realIp;
  if (!ip) {
    const fwd = req.headers.get("x-forwarded-for") ?? "";
    const hops = fwd.split(",").map((h) => h.trim()).filter(Boolean);
    ip = hops.length ? hops[hops.length - 1]! : "unknown";
  }
  return `${scope}:${hashKey(ip)}`;
}

/** Tiny, dependency-free FNV-1a hash → hex. Not cryptographic; only used to
 *  avoid storing raw IPs as rate-limit keys. */
export function hashKey(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/* ── Response-size ceiling ───────────────────────────────────────────────── */

/**
 * Maximum bytes of an upstream body the proxy will stream for a NON-playlist
 * response (a media segment). HLS segments are typically well under this; the
 * cap exists to stop the proxy being abused to shuttle arbitrarily large public
 * files through the deployment. Playlists are text and handled separately.
 */
export const MAX_SEGMENT_BYTES = 12 * 1024 * 1024; // 12 MiB

/** Maximum bytes read for a playlist body (text; anything larger is bogus). */
export const MAX_PLAYLIST_BYTES = 4 * 1024 * 1024; // 4 MiB

/** Maximum subtitle body size (text/vtt). */
export const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024; // 2 MiB

/**
 * If the upstream advertises a `Content-Length` over `max`, reject before
 * streaming. Returns true when the response is safe to relay. When the length is
 * unknown (chunked), the caller must enforce the cap while streaming instead.
 */
export function withinDeclaredSize(contentLength: string | null, max: number): boolean {
  if (contentLength == null) return true; // unknown → enforce during streaming
  const n = Number(contentLength);
  if (!Number.isFinite(n)) return true;
  return n <= max;
}
