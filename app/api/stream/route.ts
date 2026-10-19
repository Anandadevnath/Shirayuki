import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";
import { rewritePlaylist, capStream, readTextWithinLimit } from "@/lib/api/playlist";
import {
  MAX_PLAYLIST_BYTES,
  MAX_SEGMENT_BYTES,
  withinDeclaredSize,
} from "@/lib/api/rate-limit";
import { proxyOptions, enforceRateLimit, PLAYLIST_CACHE_CONTROL } from "@/lib/api/proxy-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** First-party HLS proxy. The embed hosts gate streams behind a `Referer` the
 *  browser can't set, and serve cross-origin. We fetch upstream with the right
 *  headers, rewrite playlist URIs back through this proxy, and stream segments.
 *
 *  SECURITY: the `url` parameter is caller-controlled, so every target —
 *  including each redirect hop — must pass the SSRF guard in
 *  `lib/api/proxy-guard.ts` (scheme/host/DNS checks against private and
 *  link-local ranges). The `referer` parameter is sanitized before it is
 *  forwarded upstream. There is deliberately NO permissive CORS header: all
 *  consumers (the player, hls.js, native Safari HLS) load these URLs
 *  same-origin, so a wildcard `Access-Control-Allow-Origin` would only turn
 *  this deployment into an open relay for third-party sites.
 *
 *  ABUSE RESISTANCE (SEC-01): because this route relays caller-chosen public
 *  URLs, it is rate-limited per client (distributed when Upstash is configured,
 *  per-instance otherwise — see lib/api/rate-limit.ts) and bounds the bytes it
 *  will relay, so the deployment cannot be turned into a free bandwidth relay. */

/** Preflight handler (shared implementation — see lib/api/proxy-responses.ts). */
export function OPTIONS() {
  return proxyOptions();
}

export async function GET(req: NextRequest) {
  // SEC-01: per-client rate limit before any upstream work. 429 carries a
  // `Retry-After` but no internal detail.
  const limited = await enforceRateLimit(req, "stream");
  if (limited) return limited;

  const { searchParams, origin } = new URL(req.url);
  const target = searchParams.get("url");
  const referer = sanitizeReferer(searchParams.get("referer")) ?? "";

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "*/*",
  };
  if (referer) {
    headers.Referer = referer;
    headers.Origin = new URL(referer).origin;
  }
  const range = req.headers.get("range");
  if (range) headers.Range = range;

  // Validates the target (and every redirect hop) before any bytes move.
  const fetched = await fetchGuarded(target, headers);
  if (!fetched.ok) {
    return new Response(
      fetched.status === 400 ? "Bad url" : "Upstream fetch failed",
      { status: fetched.status },
    );
  }
  const { res } = fetched;
  const upstream = fetched.url;

  if (!res.ok && res.status !== 206) {
    return new Response(`Upstream ${res.status}`, { status: res.status });
  }

  const ctype = res.headers.get("content-type") ?? "";
  const isPlaylist =
    upstream.pathname.endsWith(".m3u8") ||
    ctype.includes("mpegurl") ||
    ctype.includes("vnd.apple.mpegurl");

  if (isPlaylist) {
    // SEC-01: a playlist is text; refuse an implausibly large one. The declared
    // `Content-Length` is a fast pre-check, and `readTextWithinLimit` enforces
    // the ceiling DURING the read so a chunked (unknown-length) upstream is
    // aborted rather than fully buffered into memory.
    if (!withinDeclaredSize(res.headers.get("content-length"), MAX_PLAYLIST_BYTES)) {
      return new Response("Playlist too large", { status: 413 });
    }
    const text = await readTextWithinLimit(res.body, MAX_PLAYLIST_BYTES);
    if (text === null) {
      return new Response("Playlist too large", { status: 413 });
    }
    const rewritten = rewritePlaylist(text, upstream.toString(), referer, origin);
    return new Response(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": PLAYLIST_CACHE_CONTROL,
      },
    });
  }

  // Segment / key / init — stream bytes through, preserve range semantics.
  // SEC-01: refuse a segment the upstream declares as over the ceiling before
  // any bytes move; chunked (unknown-length) bodies are capped while streaming.
  if (!withinDeclaredSize(res.headers.get("content-length"), MAX_SEGMENT_BYTES)) {
    try {
      res.body?.cancel();
    } catch {
      /* body may already be unusable */
    }
    return new Response("Segment too large", { status: 413 });
  }

  const out = new Headers();
  const passthrough = ["content-type", "content-length", "content-range", "accept-ranges"];
  for (const h of passthrough) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("content-type")) out.set("content-type", "video/mp2t");
  out.set("Cache-Control", "public, max-age=3600");

  return new Response(capStream(res.body, MAX_SEGMENT_BYTES), {
    status: res.status,
    headers: out,
  });
}