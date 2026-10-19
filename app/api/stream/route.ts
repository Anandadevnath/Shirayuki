import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";
import {
  MAX_PLAYLIST_BYTES,
  readTextWithinLimit,
  withinDeclaredSize,
} from "@/lib/api/bounded-body";

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
 *  this deployment into an open relay for third-party sites. */

/** Preflight handler kept for protocol clarity — it answers WITHOUT any
 *  `Access-Control-Allow-*` headers, so cross-origin requests are refused. */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function proxied(absUrl: string, referer: string, origin: string): string {
  const u = new URL("/api/stream", origin);
  u.searchParams.set("url", absUrl);
  if (referer) u.searchParams.set("referer", referer);
  return u.pathname + "?" + u.searchParams.toString();
}

function rewritePlaylist(
  text: string,
  playlistUrl: string,
  referer: string,
  origin: string,
): string {
  const base = new URL(playlistUrl);
  const resolve = (uri: string) => new URL(uri, base).toString();

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.)
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          return `URI="${proxied(resolve(uri), referer, origin)}"`;
        });
      }
      // Bare URI line (variant playlist or segment)
      return proxied(resolve(trimmed), referer, origin);
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
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
    // SEC-02: bound the playlist body. Playlists are text and tiny, so a
    // declared-oversized (or over-limit while reading) body is a bad upstream,
    // not a real playlist — reject rather than buffer it into memory. Media
    // segments below are NOT bounded here; they keep streaming.
    if (!withinDeclaredSize(res.headers.get("content-length"), MAX_PLAYLIST_BYTES)) {
      res.body?.cancel().catch(() => {});
      return new Response("Playlist too large", { status: 413 });
    }
    const bounded = await readTextWithinLimit(res.body, MAX_PLAYLIST_BYTES);
    if (!bounded.ok) {
      return new Response(
        bounded.reason === "too_large" ? "Playlist too large" : "Upstream read failed",
        { status: bounded.reason === "too_large" ? 413 : 502 },
      );
    }
    const rewritten = rewritePlaylist(bounded.text, upstream.toString(), referer, origin);
    return new Response(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        // VOD playlists are stable for the lifetime of the upload. Short
        // fresh window + stale-while-revalidate lets the edge serve the
        // cached rewritten playlist to repeat viewers without an upstream
        // round-trip, while still picking up upstream changes within ~5 min.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  // Segment / key / init — stream bytes through, preserve range semantics.
  const out = new Headers();
  const passthrough = ["content-type", "content-length", "content-range", "accept-ranges"];
  for (const h of passthrough) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("content-type")) out.set("content-type", "video/mp2t");
  out.set("Cache-Control", "public, max-age=3600");

  return new Response(res.body, { status: res.status, headers: out });
}