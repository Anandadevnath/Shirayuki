/**
 * Shared response builders for the first-party proxy routes
 * (`/api/stream`, `/api/subtitle`).
 *
 * Both routes need the same three things: a CORS-refusing `OPTIONS` handler, a
 * `429` rate-limit response, and (for playlists) a shared edge-cache directive.
 * Keeping one implementation here prevents the two routes from drifting — a
 * tightening in one must apply to both. Lives in a leaf module so it is
 * alias-free and unit testable.
 */

import {
  checkRateLimit,
  clientKey,
  DEFAULT_PROXY_LIMITS,
} from "./rate-limit";

/** Shared SWR directive for short-lived, edge-cacheable JSON/text responses
 *  (rewritten HLS playlists, suggest typeahead). Single source so the routes
 *  cannot drift on the cache window. */
export const SWR_60 = "public, s-maxage=60, stale-while-revalidate=300";

/** Alias kept for readability at the playlist call site. */
export const PLAYLIST_CACHE_CONTROL = SWR_60;

/**
 * Preflight handler for a proxy route. Answers 204 WITHOUT any
 * `Access-Control-Allow-Origin`, so cross-origin callers are refused. Shared by
 * both routes (identical protocol behaviour by design).
 */
export function proxyOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Enforce the per-client rate limit for `scope`. Returns a ready `429` Response
 * when the caller is over budget, otherwise `null` (carry on). One
 * implementation for both proxy routes.
 */
export async function enforceRateLimit(
  req: { headers: Headers },
  scope: string,
): Promise<Response | null> {
  const rl = await checkRateLimit(clientKey(req, scope), DEFAULT_PROXY_LIMITS);
  if (rl.allowed) return null;
  return new Response("Too many requests", {
    status: 429,
    headers: { "Retry-After": String(rl.retryAfterSeconds) },
  });
}
