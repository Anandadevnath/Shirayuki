import type { Metadata } from "next";
import Link from "next/link";
import { getCategory, getGenres, getHome, safe } from "@/lib/api";
import {
  collectionById,
  collectionForBrowseKey,
  homeBucket,
} from "@/lib/discovery/collections";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";
import type { AnimeCardModel } from "@/lib/providers/types";

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
 *   · else fall back to the canonical / "all" collection.
 */
function resolveCollection(routeId: string, param?: string) {
  if (param) {
    const byId = collectionById(param);
    if (byId) return byId;
  }
  return collectionForBrowseKey(routeId) ?? collectionById("all")!;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { collection } = await searchParams;
  return { title: resolveCollection(id, collection).title };
}

/**
 * The canonical Category route. One surface serves every collection — the
 * navbar "Category" link lands here (most-popular), and the page's Status
 * control switches collections in place while syncing the URL, so a refresh or
 * a shared link reproduces the same view.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page = "1", collection: collectionParam } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const def = resolveCollection(id, collectionParam);

  // Data source depends on the collection kind:
  //   · home-backed (Trending, Latest Episodes) → the home payload bucket;
  //   · browse-backed                            → the /browse listing.
  // The board is seeded with the same collection id, so SSR and the client
  // agree on first paint.
  const [itemsRes, genres] = await Promise.all([
    safe(
      async (): Promise<{
        results: AnimeCardModel[];
        totalPages: number;
        currentPage: number;
      }> => {
        if (def.source === "home") {
          const home = await getHome();
          return {
            results: homeBucket(home, def.key) as AnimeCardModel[],
            totalPages: 1,
            currentPage: 1,
          };
        }
        return getCategory(def.key, pageNum);
      },
    ),
    safe(() => getGenres()),
  ]);

  const genreList = genres.ok ? genres.data : [];
  const showScheduleLink = def.id === "airing";

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
              def.source === "browse" ? itemsRes.data.totalPages * PAGE_SIZE : undefined
            }
          />
          {/* Pagination only applies to browse-backed collections; a home
              bucket is a fixed snapshot. */}
          {def.source === "browse" && (
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
