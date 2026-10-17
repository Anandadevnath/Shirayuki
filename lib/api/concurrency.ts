import type { Result } from "../providers/types";

/**
 * Request-orchestration primitives shared by the data facade (`./index`).
 *
 * These live in their own module with NO provider imports so they are pure,
 * side-effect-free and directly unit-testable under node:test (the provider
 * module uses bundler-style extensionless imports node cannot resolve).
 */

/** Wrap a throwing provider call into a typed Result for graceful UI fallback.
 *  The single implementation for the whole data layer — `./index` re-exports
 *  this rather than defining its own, so the contract cannot drift. */
export async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") console.warn("[api]", error);
    return { ok: false, error };
  }
}

/**
 * Bound a promise with an explicit timeout OUTCOME. Resolves to a typed
 * `Result` that is either the successful value, the original error, or an
 * explicit `timeout` failure — never hangs. The guard that lets an optional
 * fetch participate in the initial render without any possibility of an
 * indefinite loading state: the caller names a deadline and always receives a
 * settled result by it. Note: this does NOT cancel the underlying operation —
 * it only stops the RENDER from waiting on it.
 */
export function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label = "request",
): Promise<Result<T>> {
  return new Promise<Result<T>>((resolve) => {
    const t = setTimeout(
      () => resolve({ ok: false, error: `${label} timed out after ${ms}ms` }),
      ms,
    );
    p.then(
      (data) => {
        clearTimeout(t);
        resolve({ ok: true, data });
      },
      (err) => {
        clearTimeout(t);
        resolve({ ok: false, error: err instanceof Error ? err.message : "Unknown error" });
      },
    );
  });
}
