import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-party HLS proxy. The embed hosts gate streams behind a `Referer` the
 * browser can't set, and serve cross-origin. We fetch upstream with the right
 * headers, rewrite playlist URIs back through this proxy, and stream segments.
 * (The old React app shipped a proxy helper but never wired it — bug #2.)
 */

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
  const referer = searchParams.get("referer") ?? "";
  if (!target) return new Response("Missing url", { status: 400 });

  let upstream: URL;
  try {
    upstream = new URL(target);
  } catch {
    return new Response("Bad url", { status: 400 });
  }

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

  let res: Response;
  try {
    res = await fetch(upstream.toString(), { headers, redirect: "follow" });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  if (!res.ok && res.status !== 206) {
    return new Response(`Upstream ${res.status}`, { status: res.status });
  }

  const ctype = res.headers.get("content-type") ?? "";
  const isPlaylist =
    upstream.pathname.endsWith(".m3u8") ||
    ctype.includes("mpegurl") ||
    ctype.includes("vnd.apple.mpegurl");

  if (isPlaylist) {
    const text = await res.text();
    const rewritten = rewritePlaylist(text, upstream.toString(), referer, origin);
    return new Response(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
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
  out.set("Access-Control-Allow-Origin", "*");

  return new Response(res.body, { status: res.status, headers: out });
}
