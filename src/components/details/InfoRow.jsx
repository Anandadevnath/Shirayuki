export function InfoRow({ label, children }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="text-zinc-400 font-medium">{label}:</span>
      <span className="text-zinc-300">{children}</span>
    </div>
  );
}
