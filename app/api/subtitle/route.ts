import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";
import { readTextWithinLimit } from "@/lib/api/playlist";
import { MAX_SUBTITLE_BYTES, withinDeclaredSize } from "@/lib/api/rate-limit";
import { proxyOptions, enforceRateLimit } from "@/lib/api/proxy-responses";

export const runtime = "nodejs";

/** Preflight handler (shared implementation — see lib/api/proxy-responses.ts). */
export function OPTIONS() {
  return proxyOptions();
}

/** Proxy external .vtt subtitle files (CORS) so `<SubtitleOverlay>` can load
 *  them. Some hosting CDNs (e.g. hls.dramahot.top for hianime's ZokoAnime
 *  server) gate the .vtt behind the same `Referer` as the video stream and 403
 *  without it. Accept an optional `referer` param (mirroring /api/stream) and
 *  forward it upstream — the browser cannot set Referer cross-origin, so this
 *  is the only way the subtitle fetch can carry it.
 *
 *  SECURITY: same SSRF exposure as /api/stream — `url` is caller-controlled,
 *  so it goes through `lib/api/proxy-guard.ts` (scheme + private/DNS checks)
 *  with every redirect hop re-validated, and `referer` is sanitized. No
 *  wildcard CORS: all consumers load this same-origin, so `ACAO: *` would only
 *  expose an open relay. The body stays `text/vtt` (never HTML), so a hostile
 *  upstream payload is inert in this response. */
export async function GET(req: NextRequest) {
  // SEC-01: same abuse posture as /api/stream — rate-limit before any work.
  const limited = await enforceRateLimit(req, "subtitle");
  if (limited) return limited;

  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  const referer = sanitizeReferer(url.searchParams.get("referer")) ?? "";

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0",
    Accept: "text/vtt,*/*",
  };
  if (referer) {
    headers.Referer = referer;
    headers.Origin = new URL(referer).origin;
  }

  const fetched = await fetchGuarded(target, headers);
  if (!fetched.ok) {
    return new Response(
      fetched.status === 400 ? "Bad url" : "Upstream failed",
      { status: fetched.status },
    );
  }
  const { res } = fetched;

  if (!res.ok) return new Response(`Upstream ${res.status}`, { status: res.status });

  // SEC-01: a subtitle is text; refuse an implausibly large one. The declared
  // `Content-Length` is a fast pre-check, and `readTextWithinLimit` enforces
  // the ceiling DURING the read so a chunked (unknown-length) upstream is
  // aborted rather than fully buffered into memory.
  if (!withinDeclaredSize(res.headers.get("content-length"), MAX_SUBTITLE_BYTES)) {
    return new Response("Subtitle too large", { status: 413 });
  }
  const text = await readTextWithinLimit(res.body, MAX_SUBTITLE_BYTES);
  if (text === null) {
    return new Response("Subtitle too large", { status: 413 });
  }
  const body = text.startsWith("WEBVTT") ? text : `WEBVTT\n\n${text}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}