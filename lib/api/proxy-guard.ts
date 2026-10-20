/**
 * SSRF guard for the first-party proxy routes (`/api/stream`, `/api/subtitle`).
 *
 * Both routes fetch a caller-supplied `url` server-side. Without validation
 * that makes the deployment an open proxy: anyone can make OUR server request
 * loopback/private addresses (cloud metadata at 169.254.169.254, internal
 * services, LAN hosts), or exfiltrate through it with an arbitrary `Referer`.
 *
 * The stream host set rotates upstream (many CDNs), so a closed hostname
 * allowlist is not viable here — this guard therefore enforces the standard
 * open-proxy constraints instead:
 *
 *   1. scheme must be http(s), no embedded credentials;
 *   2. hostname must be a public, dotted name (blocks `localhost`, single
 *      labels, `.local`/`.internal`-style intranet zones, metadata hostnames);
 *   3. if the hostname is an IP literal it must be a public address;
 *   4. otherwise resolve it (DNS) and require EVERY resolved address to be
 *      public — and re-run the same checks on every redirect hop.
 *
 * Residual risks (documented for the audit report): DNS rebinding between the
 * check and the fetch (TOCTOU) is not fully closed without pinning the
 * connection to the validated IP; platform egress rules (e.g. blocking the
 * link-local range at the network layer) remain the final line of defense.
 */

import { promises as dns } from "node:dns";
import net from "node:net";
import http from "node:http";
import https from "node:https";

export type ProxyUrlResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export const MAX_REDIRECTS = 3;

/** Hostname suffixes that only ever resolve inside an intranet. */
const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".localdomain",
  ".home.arpa",
  ".lan",
  ".corp",
  ".private",
];

/** Exact hostnames that reach provider/metadata endpoints. */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal", // GCP metadata (also caught by .internal suffix)
  "instance-data",            // AWS/OpenStack instance metadata alias
  "kubernetes.internal",
]);

/** Is this IPv4 address safe to fetch from a server? (false = private/reserved) */
function isPublicIpv4(ip: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return false;
  const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number];
  if (a > 255 || b > 255 || c > 255 || d > 255) return false;
  if (a === 0) return false;                    // 0.0.0.0/8 "this network"
  if (a === 10) return false;                   // 10.0.0.0/8 private
  if (a === 127) return false;                  // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return false;     // 169.254.0.0/16 link-local (cloud metadata!)
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return false;     // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return false; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && c === 0) return false;   // 192.0.0.0/24 IETF assignments
  if (a === 192 && b === 0 && c === 2) return false;   // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return false; // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && c === 100) return false;  // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return false;   // 203.0.113.0/24 TEST-NET-3
  if (a >= 224) return false;                  // 224.0.0.0/4 multicast + reserved + broadcast
  return true;
}

/** Is this IPv6 address safe to fetch from a server? */
function isPublicIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0] ?? "";
  if (!addr.includes(":")) return false; // not an IPv6 literal
  if (addr === "::" || addr === "::1") return false; // unspecified + loopback
  // IPv4-compatible/mapped space (::/96). WHATWG URL canonicalizes dotted
  // forms into hextet form before we ever see them — `http://[::ffff:7f00:1]/`
  // arrives as `::ffff:7f00:1`, i.e. 127.0.0.1 in disguise. Nothing routable
  // and public lives in ::/96, so reject the whole space conservatively.
  if (/^::[0-9a-f:]*$/.test(addr) && addr.split(":").filter(Boolean).length <= 5) {
    return false;
  }
  const hextet = parseInt(addr.split(":")[0] || "0", 16);
  if (Number.isNaN(hextet)) return false;
  if ((hextet & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((hextet & 0xffc0) === 0xfe80) return false; // fe80::/10 link-local
  if ((hextet & 0xff00) === 0xff00) return false; // ff00::/8 multicast
  if (addr.startsWith("2001:db8:")) return false; // documentation range
  if (addr.startsWith("64:ff9b:")) return false;  // NAT64 (can embed IPv4)
  return true;
}

export function isPublicIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPublicIpv4(ip);
  if (version === 6) return isPublicIpv6(ip);
  return false; // not an IP at all
}

/** 60s memo for DNS verdicts — segments from the same host resolve together. */
const dnsCache = new Map<string, { ok: boolean; expires: number }>();
const DNS_TTL_MS = 60_000;

/** Resolve every address for `hostname`; all must be public. */
async function resolvesToPublic(hostname: string): Promise<boolean> {
  if (net.isIP(hostname) !== 0) return isPublicIp(hostname);
  const cached = dnsCache.get(hostname);
  if (cached && cached.expires > Date.now()) return cached.ok;
  let ok = false;
  try {
    const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
    ok = addrs.length > 0 && addrs.every((a) => isPublicIp(a.address));
  } catch {
    ok = false; // unresolvable → the fetch would fail anyway
  }
  dnsCache.set(hostname, { ok, expires: Date.now() + DNS_TTL_MS });
  return ok;
}

/* ── DNS-rebinding hardening (SEC-03) ────────────────────────────────────────
 * `validateProxyUrl` resolves DNS, then the request resolves it AGAIN — a
 * classic TOCTOU. An attacker who controls the authoritative DNS answer can
 * return a public IP for the validation lookup and a private IP for the
 * connection. The fix is to PIN the connection to the exact IP we validated:
 * we resolve once here, keep those validated addresses, and hand the kernel a
 * `lookup` that can ONLY return them. TLS SNI (`servername`) and the `Host`
 * header keep the ORIGINAL hostname, so CDN virtual-hosting still works.
 *
 * If pinning cannot be used (e.g. an IP-literal target, which needs no DNS),
 * or if the pinned transport fails for any reason, the caller falls back to
 * the ordinary `fetch`, so playback never becomes LESS functional than before.
 * ------------------------------------------------------------------------- */

/** Resolve a hostname to its addresses. Returns null on failure. */
async function resolveAll(hostname: string): Promise<Array<{ address: string; family: number }> | null> {
  try {
    const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
    return addrs.map((a) => ({ address: a.address, family: a.family }));
  } catch {
    return null;
  }
}

/**
 * A `lookup` implementation that only ever yields the pre-validated addresses.
 * This is what makes the connection immune to a DNS flip after validation.
 */
function pinnedLookup(validated: Array<{ address: string; family: number }>) {
  return (
    _hostname: string,
    _options: unknown,
    cb: (err: NodeJS.ErrnoException | null, address: string | Array<{ address: string; family: number }>, family?: number) => void,
  ) => {
    const first = validated[0];
    if (!first) {
      cb(new Error("no validated address"), "", 0);
      return;
    }
    cb(null, first.address, first.family);
  };
}

/**
 * Bridge a Node `IncomingMessage` to a web `ReadableStream` so the pinned
 * transport can hand the route a normal `Response` whose body still streams
 * (media segments must not be buffered).
 */
function nodeStreamToWeb(stream: http.IncomingMessage): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });
}

/**
 * Perform a GET over Node's http/https with the connection PINNED to the
 * validated IP(s). Returns a WHATWG `Response` or throws on transport failure
 * (the caller then falls back to plain `fetch`).
 *
 * Only a HEAD-like concern matters here: the media segment BODY streams through
 * the returned Response, so this must preserve streaming. We hand back the
 * Node `IncomingMessage` as a web ReadableStream.
 */
async function pinnedFetch(
  target: URL,
  headers: Record<string, string>,
  validated: Array<{ address: string; family: number }>,
  signal: AbortSignal,
): Promise<Response> {
  const isHttps = target.protocol === "https:";
  const mod = isHttps ? https : http;

  return await new Promise<Response>((resolve, reject) => {
    const req = mod.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: "GET",
        headers,
        // Keep SNI + certificate validation against the real hostname.
        ...(isHttps ? { servername: target.hostname } : {}),
        // The security-critical bit: resolve to the exact validated IP.
        lookup: pinnedLookup(validated) as never,
        signal,
      },
      (res) => {
        const outHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (Array.isArray(v)) for (const vv of v) outHeaders.append(k, vv);
          else if (v != null) outHeaders.set(k, v);
        }
        const status = res.statusCode ?? 502;
        // Redirects are handled by the caller; expose the body as null for them.
        const body =
          status >= 300 && status < 400 ? null : nodeStreamToWeb(res);
        resolve(new Response(body, { status, headers: outHeaders }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

/**
 * Validate a caller-supplied proxy target. Returns the parsed URL when it is
 * safe to fetch from our server, otherwise the rejection reason.
 */
export async function validateProxyUrl(raw: string | null | undefined): Promise<ProxyUrlResult> {
  if (!raw) return { ok: false, reason: "missing url" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "unparsable url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: `scheme not allowed: ${url.protocol}` };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials in url" };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, reason: "empty host" };
  if (BLOCKED_HOSTS.has(host)) return { ok: false, reason: "blocked host" };
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "blocked host suffix" };
  }
  // Public hostnames always contain a dot; single labels resolve via local
  // search domains to intranet names.
  if (net.isIP(host) === 0 && !host.includes(".")) {
    return { ok: false, reason: "single-label host" };
  }

  if (!(await resolvesToPublic(host))) {
    return { ok: false, reason: "host does not resolve to a public address" };
  }
  return { ok: true, url };
}

/**
 * Sanitize the optional upstream `Referer` forwarded to the CDN. It is an
 * attacker-controlled request parameter, so it must be a plain http(s) URL
 * with no control characters (header injection) and no credentials.
 */
export function sanitizeReferer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export type GuardedFetchResult =
  | { ok: true; res: Response; url: URL }
  | { ok: false; status: number; reason: string };

/**
 * Fetch a proxy target with SSRF validation applied to the initial URL AND
 * every redirect hop (`fetch` would otherwise happily follow a public host's
 * 302 straight into 169.254.169.254).
 *
 * On failure, `status` is the HTTP status the route should answer with:
 * 400 for an invalid caller-supplied target, 502 for a blocked/dying hop.
 */
/** Default per-hop connect/headers budget for a guarded proxy fetch. Long
 *  enough for a cold CDN TLS handshake + first byte, short enough that a
 *  stalled upstream cannot pin a serverless invocation. Media segment bodies
 *  stream AFTER headers arrive, so this bounds only the head, not the bytes. */
const GUARDED_FETCH_TIMEOUT_MS = 15_000;

export async function fetchGuarded(
  rawUrl: string | null | undefined,
  headers: Record<string, string>,
  timeoutMs: number = GUARDED_FETCH_TIMEOUT_MS,
): Promise<GuardedFetchResult> {
  const initial = await validateProxyUrl(rawUrl);
  if (!initial.ok) return { ok: false, status: 400, reason: initial.reason };

  let current = initial.url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Abort the hop if the upstream never answers headers. Without this a
    // half-open CDN connection held the proxy route (and its serverless slot)
    // open until the platform's own hard limit — the player meanwhile showed
    // an indefinite "Loading…". A 502 sends it down the existing recovery path.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      // SEC-03: for a DNS hostname, pin the connection to the validated IP so
      // a post-validation DNS flip cannot redirect it to private space. An IP
      // literal needs no lookup and skips pinning. If the pinned transport
      // fails we fall back to the ordinary fetch (never less functional).
      const host = current.hostname.toLowerCase().replace(/^\[|\]$/g, "");
      const usePin = net.isIP(host) === 0;
      if (usePin) {
        const validated = await resolveAll(host);
        if (validated && validated.every((a) => isPublicIp(a.address))) {
          try {
            res = await pinnedFetch(current, headers, validated, controller.signal);
          } catch {
            res = await fetch(current.toString(), {
              headers,
              redirect: "manual",
              signal: controller.signal,
            });
          }
        } else {
          // Could not re-resolve to a public address → block rather than fetch.
          return { ok: false, status: 502, reason: "host did not resolve to a public address" };
        }
      } else {
        res = await fetch(current.toString(), {
          headers,
          redirect: "manual",
          signal: controller.signal,
        });
      }
    } catch {
      return { ok: false, status: 502, reason: "upstream fetch failed" };
    } finally {
      clearTimeout(timer);
    }

    if (res.status < 300 || res.status >= 400 || res.status === 304) {
      return { ok: true, res, url: current };
    }

    // Redirect hop — re-validate the destination before following it.
    const location = res.headers.get("location");
    try {
      res.body?.cancel();
    } catch {
      /* body may already be unusable from a redirect response */
    }
    if (!location) return { ok: true, res, url: current };
    if (hop === MAX_REDIRECTS) {
      return { ok: false, status: 502, reason: "too many redirects" };
    }

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return { ok: false, status: 502, reason: "unparsable redirect" };
    }
    const revalidated = await validateProxyUrl(next.toString());
    if (!revalidated.ok) {
      return { ok: false, status: 502, reason: `redirect blocked: ${revalidated.reason}` };
    }
    current = revalidated.url;
  }
  return { ok: false, status: 502, reason: "too many redirects" };
}