/**
 * Pure playback-recovery policy for the HLS player.
 *
 * The Player wires hls.js fatal errors into this state machine so recovery is
 * BOUNDED: a source that keeps failing (dead CDN, expired token, revoked
 * manifest) reaches a terminal `exhausted` verdict instead of looping
 * `startLoad()` forever. Kept free of hls.js / DOM types so it is unit-testable
 * under node:test and reviewable in isolation.
 *
 * hls.js separates fatal errors into two families:
 *   - networkError → the manifest/segment fetch failed. `startLoad()` retries.
 *   - mediaError   → the media element could not decode. `recoverMediaError()`
 *                    swaps in a fresh SourceBuffer and retries.
 * Both are worth a SMALL number of retries; beyond that the error is treated as
 * terminal and the UI offers an explicit retry / alternative source.
 */

export type HlsErrorType = "networkError" | "mediaError" | "otherError" | string;

export type RecoveryAction =
  | { kind: "network" } // hls.startLoad()
  | { kind: "media" } // hls.recoverMediaError()
  | { kind: "exhausted" }; // stop retrying; surface a fatal UI state

export interface RecoveryState {
  network: number;
  media: number;
}

export const initialRecovery: RecoveryState = { network: 0, media: 0 };

/** Retry budgets per error family. Small on purpose: hls.js already retries
 *  each segment internally (manifest/level/frag load policies), so these are
 *  the OUTER budgets for errors hls.js declared fatal. */
export const MAX_NETWORK_RECOVERIES = 2;
export const MAX_MEDIA_RECOVERIES = 1;

/**
 * Decide the next recovery action for a fatal error and return the NEW state.
 * A non-fatal error is never routed here (the caller filters on `data.fatal`).
 */
export function nextRecovery(
  state: RecoveryState,
  type: HlsErrorType,
): { action: RecoveryAction; state: RecoveryState } {
  if (type === "networkError") {
    if (state.network < MAX_NETWORK_RECOVERIES) {
      return { action: { kind: "network" }, state: { ...state, network: state.network + 1 } };
    }
    return { action: { kind: "exhausted" }, state };
  }
  if (type === "mediaError") {
    if (state.media < MAX_MEDIA_RECOVERIES) {
      return { action: { kind: "media" }, state: { ...state, media: state.media + 1 } };
    }
    return { action: { kind: "exhausted" }, state };
  }
  // Any other fatal type (e.g. manifestParsingError surfaced as fatal) is not
  // recoverable via startLoad/recoverMediaError.
  return { action: { kind: "exhausted" }, state };
}
