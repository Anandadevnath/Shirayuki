import type { Metadata } from "next";
import Link from "next/link";
import { getGenres, safe } from "@/lib/api";
import { loadCollection } from "@/lib/discovery/collection-data";
import {
  collectionById,
  collectionForBrowseKey,
  defaultCollection,
} from "@/lib/discovery/collections";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";

/** Upstream list pages serve 30 titles each. */
const PAGE_SIZE = 30;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; collection?: string }>;
};

/**
 * Resolve the collection a request represents:
 *   · `?collection=<id>` (home-backed collections land here) wins;
 *   · else the route id maps to a known collection;
 *   · else fall back to the neutral default.
 *
 * The route id itself is also the browse key, so an unknown `/category/<x>`
 * still fetches `/browse/<x>` (organic upstream ids keep working).
 */
function resolveCollection(routeId: string, param?: string) {
  if (param) {
    const byId = collectionById(param);
    if (byId) return byId;
  }
  return collectionForBrowseKey(routeId) ?? defaultCollection();
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { collection } = await searchParams;
  return { title: resolveCollection(id, collection).title };
}

/**
 * Explicit collection route — `/category/most-popular`, `/category/top-airing`,
 * `/category/<upstream-id>`. The neutral default lives at `/category`.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page = "1", collection: collectionParam } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const def = resolveCollection(id, collectionParam);
  // When the id is not a known collection it IS the upstream browse key.
  const browseDef =
    collectionForBrowseKey(id) === undefined && !collectionParam
      ? { ...def, source: "browse" as const, key: id }
      : def;

  const [itemsRes, genres] = await Promise.all([
    safe(() => loadCollection(browseDef, pageNum)),
    safe(() => getGenres()),
  ]);

  const genreList = genres.ok ? genres.data : [];
  const showScheduleLink = browseDef.id === "airing";

  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      {!itemsRes.ok ? (
        <ErrorState retryHref={`/category/${encodeURIComponent(id)}`} />
      ) : !itemsRes.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <DiscoveryBoard
            items={itemsRes.data.results}
            collectionId={def.id}
            genres={genreList}
            totalCount={
              browseDef.source === "browse"
                ? itemsRes.data.totalPages * PAGE_SIZE
                : undefined
            }
          />
          {/* Pagination only applies to browse-backed collections; a home
              bucket is a fixed snapshot. */}
          {browseDef.source === "browse" && (
            <Pagination
              basePath={`/category/${encodeURIComponent(id)}`}
              currentPage={itemsRes.data.currentPage}
              totalPages={itemsRes.data.totalPages}
            />
          )}
          {showScheduleLink && (
            <Link
              href="/schedule"
              className="self-start text-sm text-muted transition-colors hover:text-frost"
            >
              View release schedule
            </Link>
          )}
        </>
      )}
    </div>
  );
}

