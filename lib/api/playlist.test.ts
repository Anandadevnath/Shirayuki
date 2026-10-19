import { test } from "node:test";
import assert from "node:assert/strict";
import { proxied, rewritePlaylist, capStream } from "./playlist.ts";

const ORIGIN = "https://shirayuki.example";

test("proxied builds a same-origin /api/stream URL with url + referer", () => {
  const out = proxied("https://cdn.example/seg.ts", "https://site.example/", ORIGIN);
  assert.ok(out.startsWith("/api/stream?"));
  const q = new URLSearchParams(out.split("?")[1]);
  assert.equal(q.get("url"), "https://cdn.example/seg.ts");
  assert.equal(q.get("referer"), "https://site.example/");
});

test("proxied omits referer when empty", () => {
  const out = proxied("https://cdn.example/seg.ts", "", ORIGIN);
  const q = new URLSearchParams(out.split("?")[1]);
  assert.equal(q.get("referer"), null);
});

test("rewritePlaylist rewrites bare segment lines to relative/absolute upstream URLs", () => {
  const body = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "seg-1.ts",
    "seg-2.ts",
  ].join("\n");
  const out = rewritePlaylist(body, "https://cdn.example/hls/index.m3u8", "https://site.example/", ORIGIN);
  const lines = out.split("\n");
  assert.equal(lines[0], "#EXTM3U");
  assert.equal(lines[1], "#EXT-X-VERSION:3");
  // relative segments resolve against the playlist URL
  const q1 = new URLSearchParams(lines[2].split("?")[1]);
  assert.equal(q1.get("url"), "https://cdn.example/hls/seg-1.ts");
  const q2 = new URLSearchParams(lines[3].split("?")[1]);
  assert.equal(q2.get("url"), "https://cdn.example/hls/seg-2.ts");
});

test("rewritePlaylist rewrites URI=\"...\" attributes (EXT-X-KEY / EXT-X-MAP)", () => {
  const body = [
    "#EXTM3U",
    '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"',
    '#EXT-X-MAP:URI="init.mp4"',
  ].join("\n");
  const out = rewritePlaylist(body, "https://cdn.example/hls/index.m3u8", "", ORIGIN);
  assert.match(out, /URI="\/api\/stream\?/);
  const keyLine = out.split("\n").find((l) => l.includes("METHOD=AES-128"))!;
  const m = /URI="([^"]+)"/.exec(keyLine)!;
  const q = new URLSearchParams(m[1].split("?")[1]);
  assert.equal(q.get("url"), "https://cdn.example/hls/key.bin");
});

test("rewritePlaylist leaves comments, blanks and tags without URI untouched", () => {
  const body = [
    "#EXTM3U",
    "",
    "#EXT-X-TARGETDURATION:10",
    "# a free comment",
  ].join("\n");
  const out = rewritePlaylist(body, "https://cdn.example/hls/index.m3u8", "", ORIGIN);
  assert.equal(out, body);
});

test("rewritePlaylist resolves absolute segment URLs unchanged in path", () => {
  const body = "https://other.cdn/abs/seg.ts";
  const out = rewritePlaylist(body, "https://cdn.example/hls/index.m3u8", "", ORIGIN);
  const q = new URLSearchParams(out.split("?")[1]);
  assert.equal(q.get("url"), "https://other.cdn/abs/seg.ts");
});

test("capStream relays a body under the ceiling intact", async () => {
  const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
  const src = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(ch);
      c.close();
    },
  });
  const capped = capStream(src, 100) as ReadableStream<Uint8Array>;
  const reader = capped.getReader();
  const got: number[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got.push(...value);
  }
  assert.deepEqual(got, [1, 2, 3, 4, 5]);
});

test("capStream errors once the ceiling is exceeded", async () => {
  const big = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array(10));
      c.enqueue(new Uint8Array(10));
      c.close();
    },
  });
  const capped = capStream(big, 15) as ReadableStream<Uint8Array>;
  const reader = capped.getReader();
  await reader.read(); // first 10 bytes OK
  await assert.rejects(() => reader.read(), /size ceiling/);
});

test("capStream returns null for a null body", () => {
  assert.equal(capStream(null, 10), null);
});
