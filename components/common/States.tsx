import Link from "next/link";
import { CloudSnow, RotateCcw } from "lucide-react";

export function EmptyState({
  title = "Fresh snow",
  message = "Nothing here yet.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-lg border border-line bg-surface/40 px-6 py-16 text-center">
      <CloudSnow className="size-8 text-faint" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

export function ErrorState({
  message = "We couldn’t reach the provider. It may be temporarily down.",
  retryHref,
}: {
  message?: string;
  retryHref?: string;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-6 py-16 text-center">
      <h3 className="text-lg font-semibold">Something melted</h3>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {retryHref && (
        <Link
          href={retryHref}
          className="mt-1 flex items-center gap-2 rounded-sm border border-line px-4 py-2 text-sm hover:border-frost/40"
        >
          <RotateCcw className="size-4" /> Try again
        </Link>
      )}
    </div>
  );
}
