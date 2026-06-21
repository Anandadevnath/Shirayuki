# Graph Report - .  (2026-06-21)

## Corpus Check
- Large corpus: 722 files · ~491,404 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 451 nodes · 811 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Home Feed Components|Home Feed Components]]
- [[_COMMUNITY_Browse & Search Pages|Browse & Search Pages]]
- [[_COMMUNITY_AnimeX Provider Client|AnimeX Provider Client]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Project Docs & Rationale|Project Docs & Rationale]]
- [[_COMMUNITY_AnimeX Mappers & Schemas|AnimeX Mappers & Schemas]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_HiAnime Mappers & Schemas|HiAnime Mappers & Schemas]]
- [[_COMMUNITY_HiAnime Client & Watch Page|HiAnime Client & Watch Page]]
- [[_COMMUNITY_Detail Page & Watchlist|Detail Page & Watchlist]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Playback Progress & Prefs|Playback Progress & Prefs]]
- [[_COMMUNITY_Strategy & Roadmap Docs|Strategy & Roadmap Docs]]
- [[_COMMUNITY_Cinematic Detail Info|Cinematic Detail Info]]
- [[_COMMUNITY_Stream Proxy Route|Stream Proxy Route]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Performance Strategy|Performance Strategy]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Typography Tokens|Typography Tokens]]
- [[_COMMUNITY_Local-First Progress|Local-First Progress]]
- [[_COMMUNITY_Subtitle Proxy|Subtitle Proxy]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 39 edges
2. `safe()` - 30 edges
3. `AnimeCardModel` - 16 edges
4. `compilerOptions` - 16 edges
5. `apiFetch()` - 11 edges
6. `apiFetch()` - 10 edges
7. `SmartImage()` - 9 edges
8. `EpBadges()` - 8 edges
9. `ErrorState()` - 8 edges
10. `Unique Differentiators Set` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Mandatory HLS Proxy Strategy` --semantically_similar_to--> `HLS Proxy (/api/stream)`  [INFERRED] [semantically similar]
  docs/03-api-architecture.md → README.md
- `Swappable Provider Abstraction` --semantically_similar_to--> `Swappable Providers Layer`  [INFERRED] [semantically similar]
  docs/03-api-architecture.md → README.md
- `Normalized Internal Model` --semantically_similar_to--> `AnimeCardModel Normalized Model`  [INFERRED] [semantically similar]
  docs/03-api-architecture.md → README.md
- `Player Phase (crown jewel, fixes #1/#2 bugs)` --semantically_similar_to--> `Unified Player (one player)`  [INFERRED] [semantically similar]
  docs/05-roadmap.md → README.md
- `OKLCH Frost Color Tokens` --semantically_similar_to--> `Frost Design System`  [INFERRED] [semantically similar]
  docs/04-design-system.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frozen Stream Pipeline (upstream → proxy → player)** — readme_api_base_url, readme_hls_proxy, readme_player, readme_providers_layer, readme_referer_injection [EXTRACTED 0.95]
- **Typed Validated Data Layer** — docs_03_api_architecture_scraper_api, docs_03_api_architecture_zod_validation, docs_03_api_architecture_normalized_model, docs_03_api_architecture_provider_abstraction [EXTRACTED 0.90]
- **Legacy Bugs Driving Rebuild Decisions** — docs_01_react_audit_hls_never_imported, docs_01_react_audit_proxy_never_applied, docs_01_react_audit_component_duplication, docs_05_roadmap_player_phase [INFERRED 0.85]

## Communities (27 total, 7 thin omitted)

### Community 0 - "Home Feed Components"
Cohesion: 0.09
Nodes (31): AnimeCard, EpBadges(), TypePill(), HomePage(), ScheduleSection(), upcomingWeek(), Pagination(), RailShell() (+23 more)

### Community 1 - "Browse & Search Pages"
Cohesion: 0.11
Nodes (25): Grid(), safe(), generateMetadata(), pretty(), Props, generateMetadata(), pretty(), Props (+17 more)

### Community 2 - "AnimeX Provider Client"
Cohesion: 0.09
Nodes (29): apiFetch(), FetchOpts, getAnime(), getAZ(), getCategory(), getEpisodes(), getGenre(), getHome() (+21 more)

### Community 3 - "App Shell & Navigation"
Cohesion: 0.07
Nodes (26): DNS_PREFETCH_HOSTS, geistMono, geistSans, metadata, PRECONNECT_HOSTS, viewport, zen, Ambient() (+18 more)

### Community 4 - "Project Docs & Rationale"
Cohesion: 0.06
Nodes (36): Premium Polish + Retention Thesis, Upstream Provider Fragility Constraint, Component Duplication (5 cards, 2 players, 2 navs), hls.js Installed But Never Imported Bug, Proxy Never Applied to m3u8 Bug, AniList Sync, Frost Command Palette (⌘K), Unique Differentiators Set (+28 more)

### Community 5 - "AnimeX Mappers & Schemas"
Cohesion: 0.08
Nodes (26): Detail, epCount(), Raw, studioNames(), toCard(), toDetail(), toSpotlight(), detailData (+18 more)

### Community 6 - "Package Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, clsx, hls.js, lucide-react, next, react, react-dom, tailwind-merge (+21 more)

### Community 7 - "HiAnime Mappers & Schemas"
Cohesion: 0.09
Nodes (23): epCount(), Info, infoNames(), infoStr(), Raw, toCard(), toDetail(), toSpotlight() (+15 more)

### Community 8 - "HiAnime Client & Watch Page"
Cohesion: 0.16
Nodes (20): epNumberOf(), generateMetadata(), Props, WatchPage(), apiFetch(), FetchOpts, getAnime(), getAZ() (+12 more)

### Community 9 - "Detail Page & Watchlist"
Cohesion: 0.15
Nodes (17): Rail(), generateMetadata(), NotFound(), SeasonRail(), MyListButton(), Spotlight(), totalEpisodes(), AnimePage() (+9 more)

### Community 10 - "Loading Skeletons"
Cohesion: 0.13
Nodes (9): GridSkeleton(), LatestEpisodesSkeleton(), ListRowSkeleton(), PanelSkeleton(), ScheduleSkeleton(), Skeleton(), SpotlightSkeleton(), TrendingSkeleton() (+1 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Playback Progress & Prefs"
Cohesion: 0.21
Nodes (15): ContinueWatching(), Level, Player(), PlayerProps, getEpisodeSeconds(), getProgress(), listProgress(), read() (+7 more)

### Community 13 - "Strategy & Roadmap Docs"
Cohesion: 0.13
Nodes (15): Executive Verdict: Migrate Knowledge Not Code, Sode no Shirayuki Rebuild Master Plan, Reusable Legacy Backend (auth/progress), Shirayuki-React Legacy SPA, Market Research & Competitor Teardown, Scraper API Architecture & Consumption, Persistence Recommendation (IndexedDB + Postgres/Drizzle), Sode no Shirayuki Design System (+7 more)

### Community 14 - "Cinematic Detail Info"
Cohesion: 0.24
Nodes (7): CinematicInfo(), CinematicInfoProps, formatDuration(), formatEpisodes(), ReadMore(), StatCard(), StatusBadge()

## Knowledge Gaps
- **127 isolated node(s):** `Props`, `Props`, `Props`, `metadata`, `SP` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Home Feed Components` to `Browse & Search Pages`, `AnimeX Provider Client`, `App Shell & Navigation`, `HiAnime Client & Watch Page`, `Detail Page & Watchlist`, `Loading Skeletons`, `Playback Progress & Prefs`, `Cinematic Detail Info`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `AnimeCardModel` connect `Home Feed Components` to `Browse & Search Pages`, `AnimeX Provider Client`, `App Shell & Navigation`, `AnimeX Mappers & Schemas`, `HiAnime Mappers & Schemas`, `HiAnime Client & Watch Page`, `Detail Page & Watchlist`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `safe()` connect `Browse & Search Pages` to `Home Feed Components`, `Detail Page & Watchlist`, `App Shell & Navigation`, `HiAnime Client & Watch Page`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `safe()` (e.g. with `generateMetadata()` and `AnimePage()`) actually correct?**
  _`safe()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Props`, `Props`, `Props` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home Feed Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09154437456324249 - nodes in this community are weakly interconnected._
- **Should `Browse & Search Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._