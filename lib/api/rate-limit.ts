/**
 * Rate limiting + resource ceilings for the first-party proxy routes
 * (`/api/stream`, `/api/subtitle`) — SEC-01.
 *
 * Distributed via Upstash Redis when `UPSTASH_REDIS_REST_URL` +
 * `UPSTASH_REDIS_REST_TOKEN` are set; otherwise a per-process fixed window
 * (Vercel gives each instance its own memory, so this is a best-effort
 * dampener, not a global limit). If the configured backend errors the request
 * is allowed (fail-open) unless `denyOnError` is set — a false 429 on a
 * legitimate stream is worse than a transient gap in abuse protection.
 *
 * No provider/app imports, so this is unit-testable under `node --test`.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface LimiterConfig {
  limit: number;
  windowSeconds: number;
  denyOnError: boolean;
}

/* ── In-memory fixed window (per-process fallback) ────────────────────────── */

const memoryWindows = new Map<string, { count: number; resetAt: number }>();

export function memoryLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  now: number = Date.now(),
): RateLimitResult {
  const windowMs = windowSeconds * 1000;
  const existing = memoryWindows.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(key, { count: 1, resetAt: now + windowMs });
    if (memoryWindows.size > 5000) {
      for (const [k, v] of memoryWindows) if (v.resetAt <= now) memoryWindows.delete(k);
    }
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

/* ── Upstash Redis fixed window (distributed) ─────────────────────────────── */

/** INCR + EXPIRE NX + TTL over the REST pipeline (no SDK). Returns null on any
 *  transport error so the caller can fall back / fail open. */
async function upstashLimit(
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
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
        ["TTL", key],
      ]),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown }>;
    const count = Number(json[0]?.result);
    if (!Number.isFinite(count)) return null;
    const ttl = Number(json[2]?.result);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Backend selection ────────────────────────────────────────────────────── */

export const DEFAULT_PROXY_LIMITS: LimiterConfig = {
  limit: Number(process.env.PROXY_RATE_LIMIT) > 0 ? Number(process.env.PROXY_RATE_LIMIT) : 300,
  windowSeconds:
    Number(process.env.PROXY_RATE_WINDOW_SECONDS) > 0
      ? Number(process.env.PROXY_RATE_WINDOW_SECONDS)
      : 60,
  denyOnError: process.env.PROXY_RATE_LIMIT_DENY_ON_ERROR === "1",
};

/**
 * Skip the Upstash round-trip for a key that passed very recently: HLS playback
 * fans one episode into hundreds of segment requests, and a network hop per
 * segment would hit the hottest path. Denials are never memoized, and a key not
 * just allowed still pays the real check, so this cannot be used to bypass.
 */
const VERDICT_TTL_MS = 5_000;
const allowMemo = new Map<string, number>();

/** Clear in-process state (tests). */
export function __resetLimiterState(): void {
  memoryWindows.clear();
  allowMemo.clear();
}

export async function checkRateLimit(
  key: string,
  config: LimiterConfig,
  env: Record<string, string | undefined> = process.env,
): Promise<RateLimitResult> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const now = Date.now();
    const until = allowMemo.get(key);
    if (until !== undefined && until > now) {
      return { allowed: true, remaining: config.limit, retryAfterSeconds: config.windowSeconds };
    }
    if (until !== undefined) allowMemo.delete(key);

    const r = await upstashLimit(url, token, key, config.limit, config.windowSeconds);
    if (r) {
      if (r.allowed) {
        allowMemo.set(key, now + VERDICT_TTL_MS);
        if (allowMemo.size > 10_000) {
          for (const [k, v] of allowMemo) if (v <= now) allowMemo.delete(k);
        }
      }
      return r;
    }
    if (config.denyOnError) {
      return { allowed: false, remaining: 0, retryAfterSeconds: config.windowSeconds };
    }
  }

  return memoryLimit(key, config.limit, config.windowSeconds);
}

/**
 * Rate-limit key from a request. `x-real-ip` (platform-set) is preferred;
 * otherwise the RIGHTMOST `x-forwarded-for` hop — the leftmost is caller-forgeable
 * (the platform appends its own hop after any spoofed value). The IP is hashed so
 * raw addresses are never stored as keys.
 */
export function clientKey(req: { headers: Headers }, scope: string): string {
  const realIp = (req.headers.get("x-real-ip") ?? "").trim();
  if (realIp) return `${scope}:${hashKey(realIp)}`;

  const hops = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return `${scope}:${hashKey(hops.length ? hops[hops.length - 1]! : "unknown")}`;
}

/** FNV-1a → hex. Not cryptographic; only used to avoid storing raw IPs. */
export function hashKey(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/* ── Response-size ceilings ───────────────────────────────────────────────── */

export const MAX_SEGMENT_BYTES = 12 * 1024 * 1024;
export const MAX_PLAYLIST_BYTES = 4 * 1024 * 1024;
export const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;

/** Reject before streaming when the upstream declares an over-limit length.
 *  Unknown (chunked) lengths return true — the caller caps during the stream. */
export function withinDeclaredSize(contentLength: string | null, max: number): boolean {
  if (contentLength == null) return true;
  const n = Number(contentLength);
  return !Number.isFinite(n) || n <= max;
}
