/**
 * Pure HLS playlist rewriting + bounded body readers for the first-party stream
 * proxy. No provider/framework imports, so it is unit-testable under
 * `node --test` (the routes import the `@/`-aliased provider graph, which Node
 * cannot resolve).
 */

/** Build a same-origin proxy URL for an upstream absolute URL. */
export function proxied(absUrl: string, referer: string, origin: string): string {
  const u = new URL("/api/stream", origin);
  u.searchParams.set("url", absUrl);
  if (referer) u.searchParams.set("referer", referer);
  return u.pathname + "?" + u.searchParams.toString();
}

/** Rewrite every URI in a playlist (bare lines + `URI="..."` attributes)
 *  through the proxy, resolving relatives against the playlist's own URL. */
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
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${proxied(resolve(uri), referer, origin)}"`);
      }
      return proxied(resolve(trimmed), referer, origin);
    })
    .join("\n");
}

/** Relay at most `max` bytes, cancelling the upstream once the ceiling is hit
 *  (no buffering). `null` body passes through. */
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
          await reader.cancel().catch(() => {});
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

/** Read a text body while enforcing `max` DURING the read, so a chunked
 *  (no `Content-Length`) upstream is aborted instead of fully buffered.
 *  Returns `null` when the ceiling is exceeded or the read fails. */
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
    return null;
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}
