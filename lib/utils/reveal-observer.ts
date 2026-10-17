/**
 * Shared scroll-reveal engine (singleton, zero per-element listeners).
 *
 * Primary path: one shared IntersectionObserver arms elements with
 * `data-shown` the first time they enter the viewport (see globals.css
 * → "Viewport reveals" for the CSS half).
 *
 * Fallback path ("jump sweep"): IntersectionObserver cannot fire for
 * elements that an instant scroll (End/Home keys, anchor links, find-
 * in-page) leaps clean past — they never intersect any frame, and
 * observer-only reveals would leave them invisible until the user
 * happened to scroll back. A single passive scroll listener (rAF-
 * throttled) sweep-marks every pending element that is not below the
 * trigger line: anything at or above the viewport bottom edge has
 * either scrolled into view or already passed by — both mean "show
 * now, once".
 *
 * Nothing here toggles per-frame classes; after the sweep empties, the
 * listener detaches itself until the next element is armed.
 */

const SHOWN = "1";

/** Elements waiting to be revealed, in DOM order. */
const pending = new Set<Element>();

export function markShown(el: Element) {
  if (el.getAttribute("data-shown") === SHOWN) return;
  el.setAttribute("data-shown", SHOWN);
  pending.delete(el);
  stopSweepIfIdle();
}

let io: IntersectionObserver | null = null;
let sweepScheduled = false;
let listening = false;

function getObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          io?.unobserve(el);
          markShown(el);
        }
      },
      {
        /* Slightly positive bottom band: start the entrance just before
           the element crosses the fold, so short sections are already
           settling as they arrive (reads as intent, not a pop). The top
           margin is negative to compensate on short viewports. */
        rootMargin: "0px 0px 12% 0px",
        threshold: 0.05,
      },
    );
  }
  return io;
}

/** rAF-throttled passive scroll sweep. */
function onScrollCheck() {
  if (sweepScheduled) return;
  sweepScheduled = true;
  requestAnimationFrame(() => {
    sweepScheduled = false;
    if (pending.size === 0) {
      stopSweep();
      return;
    }
    const line = window.innerHeight; // viewport bottom edge
    for (const el of pending) {
      const rect = el.getBoundingClientRect();
      // At/above the trigger line → visible now or already jumped past.
      if (rect.top <= line && rect.bottom >= 0) {
        markShown(el);
      }
    }
    if (pending.size === 0) stopSweep();
  });
}

function startSweep() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("scroll", onScrollCheck, { passive: true });
  // Resize can push elements into view without a scroll event.
  window.addEventListener("resize", onScrollCheck, { passive: true });
}
function stopSweep() {
  if (!listening || typeof window === "undefined") return;
  listening = false;
  window.removeEventListener("scroll", onScrollCheck);
  window.removeEventListener("resize", onScrollCheck);
}

/**
 * Arm + observe an element's reveal. Idempotent; safe to call from a
 * `useEffect`. Returns a cleanup that stops watching the element.
 */
export function observeReveal(el: Element | null): () => void {
  if (!el || (typeof el.isConnected === "boolean" && !el.isConnected)) {
    return () => {};
  }
  const observer = getObserver();
  // No IO support (ancient browsers / non-DOM env): show immediately.
  if (!observer) {
    markShown(el);
    return () => {};
  }
  pending.add(el);
  observer.observe(el);
  // In view before the first IO callback lands? Mark straight away —
  // IO fires async, and a same-frame mark avoids a hidden flash.
  const rect = el.getBoundingClientRect();
  if (rect.top <= window.innerHeight && rect.bottom >= 0) markShown(el);
  startSweep();
  return () => {
    pending.delete(el);
    if (typeof io !== "undefined" && io) io.unobserve(el);
    stopSweepIfIdle();
  };
}

function stopSweepIfIdle() {
  if (pending.size === 0) {
    stopSweep();
    if (io) {
      io.disconnect();
      io = null;
    }
  }
}
