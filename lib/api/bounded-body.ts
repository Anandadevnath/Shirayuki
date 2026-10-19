/**
 * Bounded body reader for the first-party proxy routes (SEC-02).
 *
 * `/api/stream` (playlists) and `/api/subtitle` buffer an upstream text body
 * with `res.text()`. Without a ceiling a hostile or compromised upstream can
 * stream an arbitrarily large body into the serverless function's memory and
 * crash it. This reader enforces a byte limit WHILE reading, so an oversized
 * (or chunked, no-`Content-Length`) upstream is aborted before it is buffered.
 *
 * Only TEXT bodies (HLS playlists, VTT subtitles) go through here. HLS media
 * segments are binary and must keep streaming — they never touch this module.
 *
 * Leaf module: no provider/framework imports, so `node --test` can load it
 * (the routes import the `@-aliased` provider graph, which Node cannot resolve).
 */

/** Default ceiling for an HLS playlist body. Playlists are text and tiny
 *  (a VOD master/variant is a few KB to a few hundred KB); 4 MiB is a very
 *  generous bound that still stops a runaway upstream. Overridable per call. */
export const MAX_PLAYLIST_BYTES = 4 * 1024 * 1024;

/** Default ceiling for a subtitle (WebVTT) body. Subtitles are small text
 *  files; 2 MiB is generous. Overridable per call. */
export const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;

export type BoundedTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: "too_large" | "too_large_declared" | "read_failed" };

/**
 * Fast pre-check on the upstream's declared `Content-Length`. Returns false
 * when the upstream *says* the body is over `max`, so the caller can reject
 * before reading a byte. Unknown (chunked) lengths return true — the streaming
 * cap below still applies.
 */
export function withinDeclaredSize(contentLength: string | null, max: number): boolean {
  if (contentLength == null) return true;
  // A comma-separated Content-Length (multiple hops) is bogus → treat as unknown.
  if (contentLength.includes(",")) return true;
  const n = Number(contentLength);
  if (!Number.isFinite(n) || n < 0) return true;
  return n <= max;
}

/**
 * Read a text body while enforcing `max` bytes DURING the read. Returns
 * `{ ok: false, reason: "too_large" }` (and cancels the upstream) as soon as
 * the limit is exceeded, so the full body is never buffered.
 *
 * `body === null` yields an empty string (a body-less 200 is valid for a
 * playlist that is only headers). A read error is reported, not thrown.
 */
export async function readTextWithinLimit(
  body: ReadableStream<Uint8Array> | null,
  max: number = MAX_PLAYLIST_BYTES,
): Promise<BoundedTextResult> {
  if (!body) return { ok: true, text: "" };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        // Cancel the upstream read so we stop pulling bytes immediately.
        await reader.cancel().catch(() => {});
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    // A mid-stream read failure is not a size problem; surface it distinctly
    // so the route can answer 502 rather than 413.
    return { ok: false, reason: "read_failed" };
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(merged) };
}
