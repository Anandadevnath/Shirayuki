import type { Result } from "../providers/types";

// Primary provider: HiAnime (hianime.ad). Swappable — every page consumes the
// normalized models, not the provider. AnimeX kept under ../providers/animex as
// a fallback. See docs/03-api-architecture.md.
export * from "../providers/hianime";
export type * from "../providers/types";

/** Wrap a throwing provider call into a typed Result for graceful UI fallback. */
export async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") console.error("[api]", error);
    return { ok: false, error };
  }
}
