"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <h2 className="text-2xl font-bold">Something melted</h2>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error occurred. The provider may be temporarily unavailable.
      </p>
      <button
        onClick={reset}
        className="press mt-1 flex h-10 items-center gap-2 rounded-[var(--radius-btn)] border border-line px-4 text-sm hover:border-frost/40"
      >
        <RotateCcw className="size-4" /> Try again
      </button>
    </div>
  );
}
