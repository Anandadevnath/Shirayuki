/**
 * Fixed ambient backdrop — large, low-opacity frost glows behind all content
 * to give the dark UI depth. Purely decorative; sits below everything (z -10).
 */
export function Ambient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-frost/10 blur-[140px]" />
      <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-frost-deep/10 blur-[150px]" />
      <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-sakura/[0.06] blur-[150px]" />
    </div>
  );
}
