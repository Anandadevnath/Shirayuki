import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();
const PORT = Number(process.env.PORT || 8000);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers":
    "Content-Length, Content-Range, Content-Type, Accept-Ranges",
  "Access-Control-Max-Age": "86400",
};

function withCors(headers = {}) {
  return {
    ...CORS_HEADERS,
    ...headers,
  };
}

function isAllowedTarget(targetUrl) {
  try {
    const u = new URL(targetUrl);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function isPlaylistPath(pathname) {
  return pathname.toLowerCase().endsWith(".m3u8");
}

function isSegmentLike(pathname) {
  const p = pathname.toLowerCase();
  return (
    p.endsWith(".ts") ||
    p.endsWith(".m4s") ||
    p.endsWith(".mp4") ||
    p.endsWith(".m4a") ||
    p.endsWith(".aac") ||
    p.endsWith(".mp3") ||
    p.endsWith(".vtt") ||
    p.endsWith(".webvtt") ||
    // Some hosts disguise segments as images
    p.endsWith(".gif") ||
    p.endsWith(".jpg") ||
    p.endsWith(".jpeg") ||
    p.endsWith(".png") ||
    p.endsWith(".webp") ||
    p.endsWith(".key")
  );
}

function isLikelyMediaPath(pathname) {
  return isPlaylistPath(pathname) || isSegmentLike(pathname);
}

function makeProxyUrl(c, absoluteUrl) {
  const host =
    c.req.header("x-forwarded-host") ||
    c.req.header("host") ||
    new URL(c.req.url).host;

  // Prefer forwarded proto (e.g. behind nginx/vercel). Fall back to request URL.
  // This keeps localhost working over http.
  const proto =
    c.req.header("x-forwarded-proto") ||
    new URL(c.req.url).protocol.replace(":", "") ||
    "http";

  const ref = c.req.query("ref");
  const refParam = ref ? `&ref=${encodeURIComponent(ref)}` : "";

  return `${proto}://${host}/hls?src=${encodeURIComponent(absoluteUrl)}${refParam}`;
}

function rewriteM3U8(text, baseUrl, c) {
  const base = new URL(baseUrl);

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          try {
            const abs = new URL(uri, base).toString();
            return `URI="${makeProxyUrl(c, abs)}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
      }

      try {
        const abs = new URL(trimmed, base).toString();
        return makeProxyUrl(c, abs);
      } catch {
        return line;
      }
    })
    .join("\n");
}

function copyHeaderIfPresent(sourceHeaders, targetHeaders, name) {
  const value = sourceHeaders.get(name);
  if (value) targetHeaders.set(name, value);
}

app.use("*", async (c, next) => {
  await next();

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    c.res.headers.set(key, value);
  });
});

app.options("*", (c) => {
  return new Response(null, {
    status: 204,
    headers: withCors(),
  });
});

app.get("/", (c) => {
  return c.text(
    "Proxy is running",
    200,
    withCors({ "Content-Type": "text/plain; charset=utf-8" })
  );
});

app.on("HEAD", "/", (c) => {
  return new Response(null, {
    status: 200,
    headers: withCors(),
  });
});

async function handleProxy(c) {
  const src = c.req.query("src");

  if (!src) {
    return c.text("Missing src", 400, withCors());
  }

  if (!isAllowedTarget(src)) {
    return c.text("Invalid or disallowed URL", 403, withCors());
  }

  let target;
  try {
    target = new URL(src);
  } catch {
    return c.text("Invalid URL", 400, withCors());
  }

  const pathname = target.pathname;

  if (!isLikelyMediaPath(pathname)) {
    return c.text("Unsupported media type", 400, withCors());
  }

  try {
    const requestHeaders = new Headers();

    requestHeaders.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );
    requestHeaders.set("Accept", "*/*");

    // Many HLS hosts block requests without an expected Referer/Origin.
    // Prefer explicit `ref` query (from frontend), otherwise default to upstream origin.
    const ref = c.req.query("ref") || "";
    if (ref) {
      requestHeaders.set("Referer", ref);
      try {
        requestHeaders.set("Origin", new URL(ref).origin);
      } catch {
        requestHeaders.set("Origin", target.origin);
      }
    } else {
      requestHeaders.set("Origin", target.origin);
      requestHeaders.set("Referer", `${target.origin}/`);
    }

    const incomingRange = c.req.header("range");
    if (incomingRange) requestHeaders.set("Range", incomingRange);

    // Do not forward browser's localhost referer/origin by default.

    const upstream = await fetch(src, {
      method: c.req.method === "HEAD" ? "HEAD" : "GET",
      headers: requestHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });

    const responseHeaders = new Headers();
    Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));
    responseHeaders.set("Cache-Control", "no-store");

    copyHeaderIfPresent(upstream.headers, responseHeaders, "content-type");
    copyHeaderIfPresent(upstream.headers, responseHeaders, "content-length");
    copyHeaderIfPresent(upstream.headers, responseHeaders, "content-range");
    copyHeaderIfPresent(upstream.headers, responseHeaders, "accept-ranges");

    const upstreamContentType =
      upstream.headers.get("content-type")?.toLowerCase() || "";

    const looksLikePlaylist =
      isPlaylistPath(pathname) ||
      upstreamContentType.includes("application/vnd.apple.mpegurl") ||
      upstreamContentType.includes("application/x-mpegurl");

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Upstream error");
      console.error(
        "Upstream failed:",
        upstream.status,
        src,
        errorText.slice(0, 500)
      );

      if (!responseHeaders.has("Content-Type")) {
        responseHeaders.set("Content-Type", "text/plain; charset=utf-8");
      }

      return new Response(errorText || "Upstream error", {
        status: upstream.status,
        headers: responseHeaders,
      });
    }

    if (c.req.method === "HEAD") {
      return new Response(null, {
        status: upstream.status,
        headers: responseHeaders,
      });
    }

    if (looksLikePlaylist) {
      const playlistText = await upstream.text();
      const rewritten = rewriteM3U8(playlistText, src, c);

      responseHeaders.set(
        "Content-Type",
        upstream.headers.get("content-type") || "application/vnd.apple.mpegurl"
      );

      return new Response(rewritten, {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (!responseHeaders.has("Content-Type")) {
      responseHeaders.set("Content-Type", "application/octet-stream");
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Proxy failed:", err);

    return c.json(
      {
        error: "Proxy failed",
        details: err instanceof Error ? err.message : String(err),
      },
      500,
      withCors({ "Content-Type": "application/json; charset=utf-8" })
    );
  }
}

app.get("/hls", handleProxy);
app.on("HEAD", "/hls", handleProxy);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }
);
