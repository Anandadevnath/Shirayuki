import { z } from "zod";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://shirayuki-scrapper-api-v2.vercel.app";

export const V2 = "/api/v2/animex";

interface FetchOpts {
  revalidate?: number | false;
  tags?: string[];
  noStore?: boolean;
}

/**
 * Server-only fetch wrapper for AnimeX: timeout, retry on transient failure
 * (the provider occasionally returns `database query failed` on cold start),
 * Zod-validated. Throws on hard failure; callers wrap in Result.
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
  // 3 attempts: AnimeX can fail transiently with a DB error on cold start.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.success === false) {
        throw new Error(typeof json.error === "string" ? json.error : "Provider error");
      }
      return schema.parse(json);
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider fetch failed");
}
