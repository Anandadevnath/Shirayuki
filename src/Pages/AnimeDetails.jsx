import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import Backdrop from '../components/Backdrop';

function AnimeDetails() {
  const { animeId } = useParams();
  const location = useLocation();
  const resolvedId = animeId;
  const navigate = useNavigate();
  
  // Get trending data from navigation state if available
  const trendingState = location.state || {};
  const { trendingSub, trendingDub, fromTrending } = trendingState;
  const { getAnimeDetails, getHomepage, getRecentUpdates, getSearchSuggestions, loading, error, clearError } = useShirayukiAPI();
  const [animeData, setAnimeData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [homeCounts, setHomeCounts] = useState(null);
  const [recentCounts, setRecentCounts] = useState(null);
  const [suggestionCounts, setSuggestionCounts] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const normalizeDubValue = (raw) => {
    if (raw == null) return null;
    if (typeof raw === 'object') {
      raw = raw.dub ?? raw.dubbed ?? raw?.episodes?.dub ?? raw.dub_count ?? raw;
    }
    if (raw == null) return null;
    if (typeof raw === 'boolean') return raw ? 1 : null;
    if (typeof raw === 'number') return raw > 0 ? raw : null;
    if (typeof raw === 'string') {
      const s = raw.trim().toLowerCase();
      if (s === '' || s === 'n/a' || s === 'na' || s === 'no' || s === 'none') return null;
      const n = Number(s);
      if (!Number.isNaN(n)) return n > 0 ? n : null;
      return raw;
    }
    return null;
  };

  useEffect(() => {
    if (resolvedId) {
      fetchAnimeDetails();
      fetchRecentCounts();
      fetchSuggestionCounts(resolvedId);
    }
  }, [resolvedId]);


  useEffect(() => {
    if (animeData) {
      const detailsName = animeData?.data?.anime?.info?.name || animeData?.data?.anime?.title || animeData?.data?.name || animeData?.name || animeData?.title || resolvedId || '';
      fetchSuggestionCounts(detailsName);
    }
  }, [animeData]);

  const getCleanTitle = (title) => {
    if (!title) return '';
    let cleaned = title.replace(/\s*\(?dub\)?/i, '').replace(/\s*dub$/i, '').replace(/\[dub\]/i, '').trim();
    cleaned = cleaned.replace(/:/g, '').replace(/[\s\-]+$/g, '').trim();
    return cleaned;
  };


  const fetchSuggestionCounts = async (rawTitle) => {
    try {
      const cleanTitle = getCleanTitle(rawTitle);
      if (!cleanTitle) return;
      let suggestions = await getSearchSuggestions(cleanTitle);
      let sub = null, dub = null;
      const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const mainTitleNorm = normalize(cleanTitle);
      const dubTitleNorm = normalize(cleanTitle + ' (Dub)');

      // Always pick sub and dub directly from type
      const subMatch = suggestions?.data?.find(item => item.type === 'sub');
      if (subMatch) sub = subMatch.episode;
      const dubMatch = suggestions?.data?.find(item => item.type === 'dub');
      if (dubMatch) dub = dubMatch.episode;

      if (!sub) {
        const recent = await getRecentUpdates();
        const recentList = recent?.data || [];
        const recentMatch = recentList.find(item => {
          const titles = [item?.title, item?.englishTitle, item?.name];
          return titles.some(t => t && normalize(t.replace(/\(Dub\)/i, '').replace(/\s*Dub$/i, '').trim()) === mainTitleNorm);
        });
        if (recentMatch && recentMatch.englishTitle) {
          const engTitle = getCleanTitle(recentMatch.englishTitle.replace(/\(Dub\)/i, '').replace(/\s*Dub$/i, '').trim());
          suggestions = await getSearchSuggestions(engTitle);
          const subMatchFallback = suggestions?.data?.find(item => item.type === 'sub');
          if (subMatchFallback) sub = subMatchFallback.episode;
        }
      }
      setSuggestionCounts({ sub, dub });
    } catch (e) {
      setSuggestionCounts(null);
    }
  };

  const fetchRecentCounts = async () => {
    try {
      const recent = await getRecentUpdates();
      const recentList = recent?.data || [];

      const normalizeAnimeItem = (raw = {}) => {
        const item = { ...raw };
        if (typeof item.Sub !== 'undefined' && typeof item.sub === 'undefined') item.sub = item.Sub;
        if (typeof item.Dub !== 'undefined' && typeof item.dub === 'undefined') item.dub = item.Dub;
        item.episodes = item.episodes && typeof item.episodes === 'object' ? { ...item.episodes } : {};
        const nestedSub = item.episodes.sub ?? item.episodes.Sub;
        const nestedDub = item.episodes.dub ?? item.episodes.Dub;
        if (typeof item.Sub !== 'undefined') item.sub = item.Sub;
        if (typeof item.Dub !== 'undefined') item.dub = item.Dub;
        if (typeof nestedSub !== 'undefined' && typeof item.sub === 'undefined') item.sub = nestedSub;
        if (typeof nestedDub !== 'undefined' && typeof item.dub === 'undefined') item.dub = nestedDub;
        if (typeof item.sub !== 'undefined') item.episodes.sub = item.sub;
        if (typeof item.dub !== 'undefined') item.episodes.dub = item.dub;
        if (!item.poster && item.image) item.poster = item.image;
        if (!item.image && item.poster) item.image = item.poster;
        if (!item.title && item.name) item.title = item.name;
        if (!item.name && item.title) item.name = item.title;
        return item;
      };
      const normalizedRecent = Array.isArray(recentList) ? recentList.map(normalizeAnimeItem) : recentList;

      const detailsName = animeData?.data?.anime?.info?.name || animeData?.data?.anime?.title || animeData?.data?.name || animeData?.name || animeData?.title || resolvedId || '';
      const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const normalizedResolved = normalize(detailsName);
      const match = normalizedRecent.find((item) => {
        const titles = [item?.title, item?.japanese, item?.href, item?.name, item?.slug];
        return titles.some((t) => normalize(t) === normalizedResolved) || (item?.href && normalize(item.href).includes(normalizedResolved));
      });
      if (match) {
        setRecentCounts({ sub: match.sub, dub: match.dub });
      } else {
        setRecentCounts(null);
      }
    } catch (e) {
      setRecentCounts(null);
    }
  };

  const fetchAnimeDetails = async () => {
    try {
      setIsInitialLoading(true);
      setHasError(false);
      const details = await getAnimeDetails(resolvedId);
      setAnimeData(details);
      setEpisodesData(null);
      try {
        const home = await getHomepage();
        setRecommended(home?.data?.trendingAnimes?.slice(0, 8) || []);
        const homeList = home?.data || [];
        const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const resolvedName = (details?.data?.anime?.info?.name || details?.data?.anime?.title || details?.data?.name || details?.name || details?.title || resolvedId || '').toString();
        const normalizedResolved = normalize(resolvedName);
        const trendingCandidates = (homeList || []).filter((h) => (h?.section || '').toString().toLowerCase() === 'trending');
        const findMatchIn = (list) => list.find((h) => {
          const titles = [h?.title, h?.japanese, h?.href, h?.name, h?.slug];
          return titles.some((t) => normalize(t) === normalizedResolved) || (h?.href && normalize(h.href).includes(normalizedResolved));
        });
        let match = findMatchIn(trendingCandidates) || findMatchIn(homeList);
        if (match) {
          const extractSub = (m) => m?.sub ?? m?.subtitles ?? m?.episodes?.sub ?? m?.sub_count ?? null;
          setHomeCounts({
            sub: extractSub(match),
            dub: normalizeDubValue(match)
          });
        } else {
          setHomeCounts(null);
        }
      } catch (e) {
        setRecommended([]);
        setHomeCounts(null);
      }
    } catch (err) {
      console.error('Failed to fetch anime details:', err);
      setHasError(true);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Show loading state while initially loading or when the main API context is loading
  if (isInitialLoading || (loading && !animeData)) {
    return (
      <Backdrop image={'/tanjiro.png'} blurPx={5} scale={1}>
        <LoadingSpinner size="large" />
      </Backdrop>
    );
  }

  // Show error state if there's an error from the main API context
  if (error && !animeData) {
    return (
      <Backdrop image={'/tanjiro.png'} blurPx={5} scale={1}>
        <div className="p-4 w-full max-w-md">
          <ErrorMessage message={error} onRetry={fetchAnimeDetails} />
        </div>
      </Backdrop>
    );
  }

  // Show error state if fetch failed
  if (hasError && !animeData) {
    return (
      <Backdrop image={'/tanjiro.png'} blurPx={5} scale={1}>
        <div className="p-4 w-full max-w-md">
          <ErrorMessage message="Failed to load anime details" onRetry={fetchAnimeDetails} />
        </div>
      </Backdrop>
    );
  }

  // Show "not found" only after loading is complete and no data was found
  if (!isInitialLoading && !animeData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Anime not found</div>
      </div>
    );
  }

  const raw = animeData?.data || animeData || {};
  const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
  const moreInfo = raw?.anime?.moreInfo || raw?.moreInfo || info?.moreInfo || {};
  const relatedAnimes = raw?.relatedAnimes || raw?.related || raw?.related_animes || [];
  const recommendedAnimes = raw?.recommendedAnimes || raw?.recommended || raw?.recommended_animes || recommended || [];

  const type = info?.type || moreInfo?.type || 'Unknown';
  const country = info?.country || moreInfo?.country || 'Unknown';
  const genres = info?.genres || moreInfo?.genres || [];
  const status = info?.status || moreInfo?.status || 'Unknown';
  const released = info?.released || moreInfo?.released || 'Unknown';
  const quality = info?.quality || moreInfo?.quality || 'Unknown';

  const name = info?.name || info?.info?.name || info?.title || raw?.name || 'Unknown';
  const poster = info?.poster || info?.image || info?.thumbnail || '/placeholder-anime.svg';
  const stats = info?.stats || info?.info?.stats || info;
  const epInfo = stats?.episodes || info?.episodes || { sub: 'N/A', dub: 'N/A' };

  const removeLeadingZeros = (v) => {
    if (typeof v === 'string' && /^\d+$/.test(v)) {
      return String(Number(v));
    }
    return v;
  };

  const subDisplay = (() => {
    let val = null;
    
    // Prioritize trending data if available (most accurate)
    if (fromTrending && trendingSub !== undefined && trendingSub !== null) {
      val = trendingSub;
    } else if (recentCounts && recentCounts.sub != null && !isNaN(Number(recentCounts.sub))) {
      if (suggestionCounts && suggestionCounts.sub != null && !isNaN(Number(suggestionCounts.sub))) {
        val = Number(recentCounts.sub) >= Number(suggestionCounts.sub) ? recentCounts.sub : suggestionCounts.sub;
      } else {
        val = recentCounts.sub;
      }
    } else if (suggestionCounts && suggestionCounts.sub != null) {
      val = suggestionCounts.sub;
    } else if (homeCounts && homeCounts.sub != null) {
      val = homeCounts.sub;
    } else if (info?.sub != null) {
      val = info.sub;
    } else if (info?.subtitles != null) {
      val = info.subtitles;
    } else if (epInfo?.sub != null) {
      val = epInfo.sub;
    } else {
      return 'N/A';
    }
    return removeLeadingZeros(val);
  })();

  const dubDisplay = (() => {
    let val = null;
    
    // Prioritize trending data if available (most accurate)  
    if (fromTrending && trendingDub !== undefined && trendingDub !== null) {
      val = trendingDub;
    } else {
      val = suggestionCounts && suggestionCounts.dub != null ? suggestionCounts.dub : (recentCounts && recentCounts.dub != null ? recentCounts.dub : (homeCounts && homeCounts.dub != null ? homeCounts.dub : (info?.dub != null ? info.dub : (info?.dubbed != null ? info.dubbed : (epInfo?.dub != null ? epInfo.dub : null)))));
    }
    
    if (val == null) return 'N/A';
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (s === 'n/a' || s === 'na') return 'N/A';
      if (s === 'no') return '1';
      const n = Number(val);
      if (!Number.isNaN(n)) return removeLeadingZeros(val);
      return val;
    }
    if (typeof val === 'boolean') return '1';
    if (typeof val === 'number') {
      if (val === 0) return '1';
      return removeLeadingZeros(val);
    }
    return 'N/A';
  })();

  const episodesList = episodesData?.data?.episodes || episodesData?.episodes || info?.episodesList || [];


  const resolveId = (animeOrId) => {
    if (!animeOrId) return null;
    if (typeof animeOrId === 'string') return animeOrId;
    if (animeOrId.id) return animeOrId.id;
    if (animeOrId.info?.id) return animeOrId.info.id;
    if (animeOrId.animeId) return animeOrId.animeId;
    if (animeOrId._id) return animeOrId._id;
    if (animeOrId.slug) return animeOrId.slug;
    if (animeOrId.name) return animeOrId.name.toString().toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return null;
  };

  const goToAnime = (a) => {
    const id = resolveId(a);
    if (id) navigate(`/anime/${id}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden mt-16">
      <main className="max-w-7xl mx-auto -px-4 py-0">
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="bg-gradient-to-br from-black/80 via-black/60 to-transparent rounded-2xl p-0 relative overflow-hidden shadow-2xl">
              <div className="relative w-full h-[720px] rounded-2xl overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0 z-0 w-full h-full bg-center bg-cover"
                  style={{
                    backgroundImage: `url(${poster})`,
                    filter: 'blur(200px) brightness(0.3) contrast(1)',
                    transform: 'scale(1.04)'
                  }}
                />
                <img
                  src={poster}
                  alt={name}
                  loading="eager"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ mixBlendMode: 'overlay', opacity: 0.35 }}
                />
                <div className="absolute inset-0  backdrop-blur-sm" />
                <div className="absolute left-6 top-6 bottom-6 right-6 lg:right-6 flex flex-col gap-6 text-white">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h1 className="text-3xl font-extrabold leading-tight" style={{ lineHeight: 1 }}>{name}</h1>
                        {(info?.japanese || info?.japanese_lang || raw?.japanese || raw?.japanese_lang) && (
                          <div className="mt-2 mb-2 text-gray-300 text-xl italic tracking-wide max-w-3xl" title={info?.japanese || info?.japanese_lang || raw?.japanese || raw?.japanese_lang}>
                            {info?.japanese || info?.japanese_lang || raw?.japanese || raw?.japanese_lang}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <div className="max-w-full md:max-w-[60%]">
                      <div className="flex items-center gap-2 -mt-5 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-gradient-to-r from-white/80 to-white/60 text-black px-3 py-1 rounded-full text-sm font-semibold shadow">{stats?.quality || 'HD'}</span>
                          <span className="text-gray-200 hidden sm:inline">{stats?.type || info?.type || moreInfo?.type || 'TV'} • {stats?.duration || info?.duration || moreInfo?.duration || '24m'}</span>
                        </div>
                        <span className="text-white  px-2 py-1 rounded-full text-sm">SUB: {subDisplay}</span>
                        <span className="text-white  py-1 rounded-full text-sm">DUB: {dubDisplay}</span>
                      </div>
                      <p className="text-gray-200 leading-relaxed mb-4 line-clamp-6">{info?.description || info?.info?.description || 'No description available.'}</p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            const target = resolveId(info) || resolvedId;
                            if (target) {
                              const subCountNum = Number(subDisplay) && !Number.isNaN(Number(subDisplay)) ? Number(subDisplay) : null;
                              const slugify = (s) => encodeURIComponent(
                                String(s)
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/^-+|-+$/g, '')
                                  .replace(/--+/g, '-')
                              );

                              const slug = slugify(target);
                              navigate(`/anime/${slug}/episodes`, { state: { subCount: subCountNum, originalId: target } });
                            }
                          }}
                          className="bg-white text-black px-6 py-2 rounded-full font-semibold shadow-lg transform hover:-translate-y-0.5 transition"
                        >
                          Play
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full">+ Add to list</button>
                      </div>

                      <div className="hidden lg:block mt-6">
                        <div className="text-black">
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-gray-100 text-md">Type:</span><span className="text-sm  text-white px-3 py-1 rounded-full">{type}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-md">Country:</span><span className=" text-sm  text-white px-3 py-1 rounded-full">{country}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-md">Status:</span><span className=" text-sm  text-white px-3 py-1 rounded-full">{status}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-md">Released:</span><span className=" text-sm  text-white px-3 py-1 rounded-full">{released}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-md">Quality:</span><span className="text-sm  text-white px-3 py-1 rounded-full">{quality}</span></div>
                          </div>
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-3 items-center">
                              <div className="text-gray-100 text-md mb-2">Genres:</div>
                              {genres.map((g, i) => (
                                <span key={`${g}-${i}`} className="text-glow bg-black/40 text-white px-4 py-1 rounded-full text-sm -mt-1">{g}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-48 md:w-56 h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden md:block">
                      <img src={poster} alt={name} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-black rounded-3xl border border-white/10 p-6 shadow-xl">
              <h2 className="text-2xl text-white font-bold mb-4">Episodes</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(episodesList || []).slice(0, 12).map((ep, idx) => (
                  <div key={ep.id || ep.number || idx} className="bg-black rounded-xl p-4 border border-white/5 hover:bg-gray-900 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">{ep.number || idx + 1}</div>
                      <div>
                        <div className="text-white font-semibold">{ep.title || `Episode ${ep.number || idx + 1}`}</div>
                        <div className="text-gray-400 text-sm">{ep.duration || ep.runtime || '24m'}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!(episodesList?.length) || episodesList.length === 0) && (
                  <div className="text-gray-400">Episodes not available</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AnimeDetails;