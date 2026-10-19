/**
 * Shared response builders for the first-party proxy routes (`/api/stream`,
 * `/api/subtitle`) so the two cannot drift: a CORS-refusing `OPTIONS` handler, a
 * `429` rate-limit response, and the shared SWR cache directive.
 */

import { checkRateLimit, clientKey, DEFAULT_PROXY_LIMITS } from "./rate-limit";

/** SWR directive for short-lived, edge-cacheable responses (rewritten HLS
 *  playlists, suggest typeahead). */
export const SWR_60 = "public, s-maxage=60, stale-while-revalidate=300";

/** Preflight handler: 204 WITHOUT any `Access-Control-Allow-Origin`, so
 *  cross-origin callers are refused. */
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

/** Returns a ready `429` when the caller is over budget, else `null`. */
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
