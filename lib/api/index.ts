import type { Result } from "../providers/types";

// Every page consumes the normalized models via THIS facade — primary provider
// is HiAnime (/api/v2/hianime on the Ruby API). The provider set lives under
// ../providers (hianime covers every surface; animex/anikoto are not used).
export * from "../providers/hianime";
export type * from "../providers/types";

/** Wrap a throwing provider call into a typed Result for graceful UI fallback. */
export async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") console.warn("[api]", error);
    return { ok: false, error };
  }
}
