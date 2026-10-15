import { Building2, Clapperboard } from "lucide-react";
import type { ArtistModel, CompanyModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";

/** Leading animation company — surfaced with its logo-colour swatch. */
function CompanyCard({ company }: { company: CompanyModel }) {
  return (
    <div className="glass relative flex items-center gap-4 overflow-hidden rounded-2xl p-4">
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-base"
        style={{ background: company.logoColor ?? "transparent" }}
      >
        {company.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-frost">
          Animation Studio
        </span>
        <p className="truncate font-display text-lg font-extrabold text-snow">{company.name}</p>
      </div>
    </div>
  );
}

/**
 * Production credits — the studios that animated the title plus its producer
 * companies, capped as chips, with the lead animation studio called out in a
 * swatch card on the left (the provider guarantees a company when artists
 * exist). Titles with no credited artists render nothing.
 */
export function ArtistsSection({
  artists,
  company,
}: {
  artists: ArtistModel[];
  company?: CompanyModel | null;
}) {
  if (!artists?.length && !company) return null;

  const studios = artists.filter((a) => a.kind === "studio");
  const producers = artists.filter((a) => a.kind === "producer");

  return (
    <section>
      <SectionHeader title="Production" eyebrow="Artists & Studios" />

      {company && (
        <div className="mb-5">
          <CompanyCard company={company} />
        </div>
      )}

      {(studios.length || producers.length) && (
        <div className="flex flex-wrap gap-2">
          {studios.map((a) => (
            <span
              key={`${a.kind}-${a.slug ?? a.name}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/50 px-2.5 py-1.5 text-xs text-snow"
            >
              <Clapperboard className="size-3.5 text-frost" /> {a.name}
            </span>
          ))}
          {producers.map((a) => (
            <span
              key={`${a.kind}-${a.slug ?? a.name}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/30 px-2.5 py-1.5 text-xs text-muted"
            >
              <Building2 className="size-3.5" /> {a.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
