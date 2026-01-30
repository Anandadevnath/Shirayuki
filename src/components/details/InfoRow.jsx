import { memo } from "react";

export const InfoRow = memo(function InfoRow({ label, children }) {
  return (
    <div className="flex gap-x-2 items-start">
      <span className="text-zinc-400 font-medium whitespace-nowrap">{label}:</span>
      <span className="text-zinc-300 break-words">{children}</span>
    </div>
  );
});
