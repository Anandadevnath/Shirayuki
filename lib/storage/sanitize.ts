/**
 * Shared sanitizers for browser-storage keys and values.
 *
 * Everything read from `localStorage`/`sessionStorage` is UNTRUSTED input:
 * it can be edited by hand, corrupted, written by another script on the
 * origin, or left behind by an older app version with a different shape.
 * Two classes of bug come from trusting it blindly:
 *
 *   1. Prototype pollution — assigning `obj["__proto__"] = …` reassigns the
 *      object's prototype instead of creating an own entry, so a stored
 *      `__proto__`/`constructor`/`prototype` key leaks into every later
 *      lookup on that object.
 *   2. Render crashes / over-permissive data — a non-object payload
 *      (array/primitive) or an entry missing required string fields would
 *      break React ("Objects are not valid as a React child") or flow
 *      unexpected values into the UI.
 *
 * These helpers are pure so they can be unit-tested without a DOM.
 */

/** Keys that collide with the object prototype chain. */
export const UNSAFE_STORAGE_KEYS: ReadonlySet<string> = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/** Is `key` safe to use as an own property on a plain object? */
export function isSafeStorageKey(key: unknown): key is string {
  return typeof key === "string" && key.length > 0 && !UNSAFE_STORAGE_KEYS.has(key);
}

/**
 * Parse a JSON object payload from storage into a plain record.
 * Returns an empty record for any non-object / array / unparsable value.
 * Own keys that would pollute the prototype are dropped.
 */
export function parseStorageRecord(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (!isSafeStorageKey(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Coerce to a finite number, else `fallback` (default 0). */
export function safeFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Coerce to a string, else `fallback` (default null). */
export function safeStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
