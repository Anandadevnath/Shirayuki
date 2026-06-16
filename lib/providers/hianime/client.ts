import { z } from "zod";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://shirayuki-scrapper-api-v2.vercel.app";

export const V2 = "/api/v2/hianime";

interface FetchOpts {
  /** Next revalidate seconds. Use 0 / "no-store" for stream links. */
  revalidate?: number | false;
  tags?: string[];
  noStore?: boolean;
}

/**
 * Server-only fetch wrapper: timeout, one retry on network error, Zod-validated.
 * Returns the parsed `data` payload or throws (callers wrap in Result).
 */
export async function apiFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  opts: FetchOpts = {},
): Promise<z.infer<T>> {
  const url = `${API_BASE_URL}${path}`;
  const next: { revalidate?: number | false; tags?: string[] } = {};
  if (opts.revalidate !== undefined) next.revalidate = opts.revalidate;
  if (opts.tags) next.tags = opts.tags;

  const init: RequestInit & { next?: typeof next } = {
    headers: { Accept: "application/json" },
    ...(opts.noStore ? { cache: "no-store" } : { next }),
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return schema.parse(json);
    } catch (err) {
      lastErr = err;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 350));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider fetch failed");
}
