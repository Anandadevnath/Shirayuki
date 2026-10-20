import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/SectionHeader";

/**
 * Shared shell for the legal/static pages (Terms, Privacy, DMCA). These are
 * the destinations the footer and the navigation drawer link to; they exist
 * so those links resolve to a real route instead of a 404. Styling mirrors
 * the browse pages: the standard `PageHeader` + a prose column.
 */
export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader eyebrow={eyebrow} title={title} lede={`Last updated ${updated}`} />
      <div className="max-w-3xl space-y-6 text-body leading-relaxed text-muted [&_h2]:text-title [&_h2]:font-semibold [&_h2]:text-snow [&_a]:text-frost [&_a]:underline [&_a]:underline-offset-2 [&_li]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
