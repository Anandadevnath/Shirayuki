import type { Metadata } from "next";
import { getGenres, safe } from "@/lib/api";
import { loadCollection } from "@/lib/discovery/collection-data";
import {
  collectionById,
  defaultCollection,
} from "@/lib/discovery/collections";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";

/** Upstream list pages serve 30 titles each. */
const PAGE_SIZE = 30;

type Props = {
  searchParams: Promise<{ page?: string; collection?: string }>;
};

/** The neutral default collection ("All Anime"), unless a valid `?collection=`
 *  id is supplied (home-backed collections land here). */
function resolveCollection(param?: string) {
  if (param) {
    const byId = collectionById(param);
    if (byId) return byId;
  }
  return defaultCollection();
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { collection } = await searchParams;
  return { title: resolveCollection(collection).title };
}

/**
 * The neutral Category landing route. It opens the general "All Anime" browse
 * view (NOT Most Popular), with a neutral heading and a Status default of
 * "All Anime"; `/category/most-popular` remains the explicit Popular route.
 */
export default async function CategoryBrowsePage({ searchParams }: Props) {
  const { page = "1", collection: collectionParam } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const def = resolveCollection(collectionParam);

  const [itemsRes, genres] = await Promise.all([
    safe(() => loadCollection(def, pageNum)),
    safe(() => getGenres()),
  ]);

  const genreList = genres.ok ? genres.data : [];

  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      {!itemsRes.ok ? (
        <ErrorState retryHref="/category" />
      ) : !itemsRes.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <DiscoveryBoard
            items={itemsRes.data.results}
            collectionId={def.id}
            genres={genreList}
            totalCount={
              def.source === "browse" ? itemsRes.data.totalPages * PAGE_SIZE : undefined
            }
            pagination={
              def.source === "browse" ? (
                <Pagination
                  basePath="/category"
                  currentPage={itemsRes.data.currentPage}
                  totalPages={itemsRes.data.totalPages}
                />
              ) : undefined
            }
          />
        </>
      )}
    </div>
  );
}
