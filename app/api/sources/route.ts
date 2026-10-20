import type { NextRequest } from "next/server";
import { getSources, safe } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Client-side source resolver for the player's failover loop.
 *
 * The watch PAGE already walks every server server-side before first paint, so
 * the initial source never needs this route. It exists for MID-PLAYBACK
 * failure: when a source dies after the player has mounted (expired token,
 * CDN drop, revoked manifest) the Player advances to the next candidate
 * WITHOUT a full navigation, preserving the user's timestamp. Doing that
 * client-side is the only way to keep playback position across a source swap.
 *
 * SECURITY / CACHING: `episodeId`/`server`/`category` are caller-controlled and
 * are passed ONLY to the provider's own fetch (never used to build a raw
 * upstream URL the caller controls), so there is no SSRF surface here — the
 * stream URLs themselves still travel through the SSRF-guarded `/api/stream`
 * proxy. Responses are `no-store` because provider links are short-lived and
 * personalised by expiry token; caching them would serve dead URLs.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId") ?? "";
  const server = searchParams.get("server") ?? "";
  const category = searchParams.get("category") ?? "sub";
  const ep = Number(searchParams.get("ep") ?? "1") || 1;

  if (!episodeId || !server) {
    return Response.json({ ok: false, error: "missing params" }, { status: 400 });
  }

  const res = await safe(() => getSources(episodeId, ep, server, category));
  if (!res.ok || !res.data) {
    return Response.json(
      { ok: false, error: res.ok ? "no source" : res.error },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Return the normalized source only — never the raw provider payload.
  return Response.json(
    { ok: true, source: res.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
