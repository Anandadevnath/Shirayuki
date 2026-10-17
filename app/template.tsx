/**
 * Route transition, platform-wide.
 *
 * `template.tsx` remounts on every navigation (App Router semantics), so
 * each route fade-in is a fresh one-shot animation. Opacity-only on
 * purpose — a transform or filter on this wrapper would re-anchor
 * `position: fixed` descendants while it runs (the anime detail page
 * paints its blurred backdrop via a fixed layer), so a plain 260ms fade
 * is the one variant that is provably safe on every route. Back/forward
 * navigation still replays the entrance (standard for templated routes)
 * but never blocks or re-scrolls: the browser restores scroll after the
 * navigation commits, and a 260ms opacity fade cannot interact with it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-in">{children}</div>;
}
