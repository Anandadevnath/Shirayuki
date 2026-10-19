import type { NextRequest } from "next/server";
import { fetchGuarded, sanitizeReferer } from "@/lib/api/proxy-guard";

export const runtime = "nodejs";

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

  const text = await res.text();
  const body = text.startsWith("WEBVTT") ? text : `WEBVTT\n\n${text}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}