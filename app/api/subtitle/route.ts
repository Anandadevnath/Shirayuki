import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/** CORS preflight for browsers that preflight cross-origin <track> fetches. */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/** Proxy external .vtt subtitle files (CORS) so <track> can load them.
 *  Some hosting CDNs (e.g. hls.dramahot.top for hianime's ZokoAnime server)
 *  gate the .vtt behind the same `Referer` as the video stream and 403
 *  without it. Accept an optional `referer` param (mirroring /api/stream) and
 *  forward it upstream — the browser cannot set Referer cross-origin, so this
 *  is the only way the subtitle fetch can carry it. */
export async function GET(req: NextRequest) {
  const target = new URL(req.url).searchParams.get("url");
  const referer = new URL(req.url).searchParams.get("referer") ?? "";
  if (!target) return new Response("Missing url", { status: 400 });

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0",
    Accept: "text/vtt,*/*",
  };
  if (referer) {
    headers.Referer = referer;
    try {
      headers.Origin = new URL(referer).origin;
    } catch {
      /* ignore malformed referer */
    }
  }

  let res: Response;
  try {
    res = await fetch(target, { headers });
  } catch {
    return new Response("Upstream failed", { status: 502 });
  }
  if (!res.ok) return new Response(`Upstream ${res.status}`, { status: res.status });

  const text = await res.text();
  const body = text.startsWith("WEBVTT") ? text : `WEBVTT\n\n${text}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
