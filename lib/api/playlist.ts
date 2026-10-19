/**
 * Pure HLS playlist rewriting for the first-party stream proxy.
 *
 * Extracted from `app/api/stream/route.ts` so it is directly unit-testable
 * under `node --test` (the route itself imports the `@/`-aliased provider graph,
 * whose extensionless imports Node cannot resolve — see AGENTS.md). No provider
 * or framework imports live here, so this module loads standalone.
 */

/** Build a same-origin proxy URL for an upstream absolute URL. */
export function proxied(absUrl: string, referer: string, origin: string): string {
  const u = new URL("/api/stream", origin);
  u.searchParams.set("url", absUrl);
  if (referer) u.searchParams.set("referer", referer);
  return u.pathname + "?" + u.searchParams.toString();
}

/**
 * Rewrite every URI in an HLS playlist (bare lines + `URI="..."` attributes)
 * through the proxy, resolving relative URIs against the playlist's own URL.
 */
export function rewritePlaylist(
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

/**
 * Wrap an upstream byte stream so at most `max` bytes are relayed, and the
 * upstream is cancelled the moment the ceiling is hit. Keeps streaming
 * behaviour (no full buffering) while bounding the worst case for a hostile or
 * accidentally huge target. Lives here (not in the route) so it is unit
 * testable and so `route.ts` exports nothing but its handlers.
 */
export function capStream(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): BodyInit | null {
  if (!body) return null;
  let total = 0;
  const reader = body.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        total += value.byteLength;
        if (total > max) {
          controller.error(new Error("segment exceeded size ceiling"));
          try {
            await reader.cancel();
          } catch {
            /* already closed */
          }
          return;
        }
        controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/**
 * Read a text body while enforcing a byte ceiling DURING the read, so an
 * oversized (or chunked, no-`Content-Length`) upstream is aborted before the
 * whole payload is buffered into memory. Returns `null` when the ceiling is
 * exceeded (the caller responds 413). This replaces the previous
 * `await res.text()` + post-hoc `text.length > max` check, which buffered the
 * entire body first and therefore could not bound memory.
 *
 * Non-text upstreams are still handled by `capStream` on the segment path.
 * Lives here so both proxy routes share one implementation (no drift).
 */
export async function readTextWithinLimit(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<string | null> {
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    // Upstream read error — fall back to whatever arrived, or null if none.
    if (!chunks.length) return null;
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}
