import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";
import { rewritePlaylist, capStream, readTextWithinLimit } from "@/lib/api/playlist";
import {
  MAX_PLAYLIST_BYTES,
  MAX_SEGMENT_BYTES,
  withinDeclaredSize,
} from "@/lib/api/rate-limit";
import { proxyOptions, enforceRateLimit, SWR_60 } from "@/lib/api/proxy-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** First-party HLS proxy: fetches upstream with the `Referer` the embed hosts
 *  require, rewrites playlist URIs back through this proxy, streams segments.
 *
 *  SECURITY: `url` is caller-controlled, so every target — including each
 *  redirect hop — passes the SSRF guard (lib/api/proxy-guard.ts); `referer` is
 *  sanitized. No permissive CORS header: all consumers load same-origin, so a
 *  wildcard ACAO would only make this an open relay. Rate-limited per client
 *  and byte-capped (SEC-01) so it cannot be used as free bandwidth. */

/** Preflight handler (shared — see lib/api/proxy-responses.ts). */
export function OPTIONS() {
  return proxyOptions();
}

export async function GET(req: NextRequest) {
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
    // Refuse an oversized playlist; readTextWithinLimit enforces the cap while
    // reading so a chunked upstream is not fully buffered.
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
        "Cache-Control": SWR_60,
      },
    });
  }

  // Segment / key / init — stream bytes through, preserve range semantics.
  // Reject a declared-oversized segment before any bytes move; chunked bodies
  // are capped while streaming.
  if (!withinDeclaredSize(res.headers.get("content-length"), MAX_SEGMENT_BYTES)) {
    res.body?.cancel().catch(() => {});
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