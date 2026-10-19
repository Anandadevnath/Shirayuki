/**
 * Scoped rate limiting for the first-party proxy routes (SEC-01).
 *
 * ── Why this is designed the way it is ────────────────────────────────────
 * An earlier remediation added a per-REQUEST rate gate that ran on every
 * `/api/stream` call. That broke playback: a single HLS episode fires *hundreds*
 * of segment requests (one per 2–6 s of video, plus retries, seeks and ABR
 * switches), so a per-request limit throttled normal viewing into stutter, and
 * a distributed (Upstash) check added a serial network round-trip to the
 * hottest path. It was reverted.
 *
 * The abuse we actually need to stop is the OPEN-RELAY surface: a caller
 * looping the proxy to relay arbitrary public content / burn egress. That abuse
 * lives in MANIFEST and SUBTITLE requests — the entry points a script would
 * hit — NOT in the segment flood that real playback generates. So the limiter
 * here is deliberately SCOPED:
 *
 *   · `scope: "manifest"` — bucket for playlist/manifest fetches. Counted.
 *   · `scope: "subtitle"` — bucket for subtitle fetches. Counted.
 *   · SEGMENTS ARE NEVER RATE-LIMITED. The route only calls this for the
 *     playlist branch and for /api/subtitle; the segment branch does not call
 *     it at all. Real playback therefore never touches the limiter.
 *
 * The limits are generous (default 120 manifest requests / 60 s per client)
 * because a legitimate session switches servers / episodes / qualities many
 * times; the goal is to stop *sustained abuse*, not to be tight.
 *
 * ── Deployment fit ────────────────────────────────────────────────────────
 * Vercel serverless gives each instance its own memory, so an in-memory limiter
 * is only a per-instance dampener, not a global cap. That is an acceptable
 * first line here (it still stops a single hot client hammering one instance),
 * and it never breaks playback. A distributed store (Upstash Redis over REST,
 * via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) upgrades it to a
 * global limit when configured. If the store is unreachable the request is
 * ALLOWED (fail-open) — a false 429 on a manifest would break an episode load,
 * which is worse than a brief gap in abuse protection.
 *
 * Leaf module: no provider/framework imports, unit-testable under `node --test`.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets, for `Retry-After`. */
  retryAfterSeconds: number;
}

export interface RateLimitConfig {
  /** Requests allowed per client per window, for the scoped bucket. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/** Generous defaults: a full viewing session makes far fewer manifest calls
 *  than this; a script looping the relay hits it quickly. Env-overridable. */
export const DEFAULT_MANIFEST_LIMIT: RateLimitConfig = {
  limit: Number(process.env.PROXY_MANIFEST_RATE_LIMIT) > 0
    ? Number(process.env.PROXY_MANIFEST_RATE_LIMIT)
    : 120,
  windowSeconds: Number(process.env.PROXY_RATE_WINDOW_SECONDS) > 0
    ? Number(process.env.PROXY_RATE_WINDOW_SECONDS)
    : 60,
};

export const DEFAULT_SUBTITLE_LIMIT: RateLimitConfig = {
  limit: Number(process.env.PROXY_SUBTITLE_RATE_LIMIT) > 0
    ? Number(process.env.PROXY_SUBTITLE_RATE_LIMIT)
    : 60,
  windowSeconds: Number(process.env.PROXY_RATE_WINDOW_SECONDS) > 0
    ? Number(process.env.PROXY_RATE_WINDOW_SECONDS)
    : 60,
};

/* ── In-memory fixed window (per-instance fallback) ───────────────────────── */

const windows = new Map<string, { count: number; resetAt: number }>();

/** Test-only reset. */
export function __resetRateWindows(): void {
  windows.clear();
  allowMemo.clear();
}

export function memoryLimit(
  key: string,
  config: RateLimitConfig,
  now: number = Date.now(),
): RateLimitResult {
  const windowMs = config.windowSeconds * 1000;
  const entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so the map cannot grow unbounded.
    if (windows.size > 5000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return { allowed: true, retryAfterSeconds: config.windowSeconds };
  }

  entry.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return { allowed: entry.count <= config.limit, retryAfterSeconds };
}

/* ── Upstash Redis fixed window (distributed, optional) ───────────────────── */

/** INCR + EXPIRE NX + TTL over the REST pipeline. Returns null on any
 *  transport error so the caller can fall back / fail open. */
async function upstashLimit(
  url: string,
  token: string,
  key: string,
  config: RateLimitConfig,
  timeoutMs = 1200,
): Promise<RateLimitResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(config.windowSeconds), "NX"],
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
      allowed: count <= config.limit,
      retryAfterSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : config.windowSeconds,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Allow memo (avoid a store round-trip on repeat manifest bursts) ───────── */

/**
 * A key that just passed is not re-checked against the shared store for a few
 * seconds. This keeps a burst of manifest requests (e.g. ABR re-fetching a
 * variant playlist) from paying a per-request round-trip, while a client that
 * was NOT recently seen still pays the real check — so it cannot be used to
 * bypass the limit. Denials are never memoized.
 */
const VERDICT_TTL_MS = 5_000;
const allowMemo = new Map<string, number>();

/* ── Public entry ─────────────────────────────────────────────────────────── */

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  env: Record<string, string | undefined> = process.env,
): Promise<RateLimitResult> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const now = Date.now();
    const until = allowMemo.get(key);
    if (until !== undefined && until > now) {
      return { allowed: true, retryAfterSeconds: config.windowSeconds };
    }
    if (until !== undefined) allowMemo.delete(key);

    const r = await upstashLimit(url, token, key, config);
    if (r) {
      if (r.allowed) {
        allowMemo.set(key, now + VERDICT_TTL_MS);
        if (allowMemo.size > 10_000) {
          for (const [k, v] of allowMemo) if (v <= now) allowMemo.delete(k);
        }
      }
      return r;
    }
    // Store unreachable → fall through to the in-memory dampener (never MORE open).
  }

  return memoryLimit(key, config);
}

/**
 * Derive a stable, non-PII rate-limit key. `x-real-ip` (platform-set) is
 * preferred; otherwise the RIGHTMOST `x-forwarded-for` hop — the leftmost is
 * caller-forgeable (the platform appends its own hop after any spoofed value).
 * The IP is hashed so raw addresses are never stored as keys.
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
