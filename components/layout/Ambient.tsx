/**
 * Fixed ambient backdrop — large, low-opacity frost glows behind all content
 * to give the dark UI depth. Purely decorative; sits below everything (z -10).
 * The three fields drift on very slow transform-only loops (30–44s, direction
 * offset between them) so the backdrop breathes without ever catching the
 * eye; frozen entirely under reduced-motion.
 */
export function Ambient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="ambient-drift absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-frost/10 blur-[140px]" />
      <div className="ambient-drift-2 absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-frost-deep/10 blur-[150px]" />
      <div className="ambient-drift-3 absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-sakura/[0.06] blur-[150px]" />
    </div>
  );
}
