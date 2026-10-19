import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";
import { readTextWithinLimit } from "@/lib/api/playlist";
import { MAX_SUBTITLE_BYTES, withinDeclaredSize } from "@/lib/api/rate-limit";
import { proxyOptions, enforceRateLimit } from "@/lib/api/proxy-responses";

export const runtime = "nodejs";

/** Preflight handler (shared — see lib/api/proxy-responses.ts). */
export function OPTIONS() {
  return proxyOptions();
}

/** Proxy external .vtt subtitles (CORS) so `<SubtitleOverlay>` can load them.
 *  Some CDNs gate the .vtt behind the same `Referer` as the video, so an
 *  optional `referer` param is forwarded upstream (the browser cannot set it
 *  cross-origin).
 *
 *  SECURITY: same SSRF guard as /api/stream (redirect hops re-validated);
 *  `referer` sanitized; no wildcard CORS. The body stays `text/vtt`, so a
 *  hostile upstream payload is inert. */
export async function GET(req: NextRequest) {
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

  // Refuse an oversized subtitle; the cap is enforced while reading so a
  // chunked upstream is not fully buffered.
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