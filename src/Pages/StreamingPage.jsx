import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';

function StreamingPage() {
    const { animeId } = useParams();
    const navigate = useNavigate();
    const { getEpisodeStream, getAnimeDetails, loading, error, clearError } = useShirayukiAPI();
    const location = useLocation();

    const [episodeCount, setEpisodeCount] = useState(null);
    const [selectedEp, setSelectedEp] = useState(1);
    const [iframeSrc, setIframeSrc] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [fetchingStream, setFetchingStream] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [reloading, setReloading] = useState(false);
    const [isDub, setIsDub] = useState(false);
    const [detailsData, setDetailsData] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    useEffect(() => {
        // If caller passed subCount in navigation state, use it immediately
        const navSub = location?.state?.subCount;
        if (navSub && !Number.isNaN(Number(navSub))) {
            setEpisodeCount(Number(navSub));
            return;
        }

        // Try to resolve episode count (prefer SUB counts) by fetching details
        const loadCounts = async () => {
            if (!animeId) {
                setEpisodeCount(0);
                return;
            }
            try {
                const details = await getAnimeDetails(animeId);
                // apiService returns an object with `error: true` when a non-OK response occurs
                if (details && details.error) {
                    console.warn('getAnimeDetails returned error:', details);
                    setEpisodeCount(24);
                    return;
                }
                const raw = details?.data || details || {};
                const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
                const epInfo = info?.episodes || info?.stats || {};
                const sub = epInfo?.sub ?? epInfo?.sub_count ?? info?.sub ?? null;
                if (sub && !Number.isNaN(Number(sub))) {
                    setEpisodeCount(Number(sub));
                    return;
                }

                const fallback = epInfo?.total || info?.total_episodes || info?.episodesCount || null;
                if (fallback && !Number.isNaN(Number(fallback))) {
                    setEpisodeCount(Number(fallback));
                    return;
                }

                setEpisodeCount(24);
            } catch (e) {
                console.error('Error fetching anime details for counts', e);
                setEpisodeCount(24);
            }
        };

        loadCounts();
    }, [animeId, getAnimeDetails, location?.state]);

    const episodes = useMemo(() => {
        const count = Number(episodeCount) || 0;
        return Array.from({ length: count }, (_, i) => i + 1);
    }, [episodeCount]);

    // compute effective anime id depending on sub/dub toggle
    const effectiveAnimeId = useMemo(() => {
        if (!animeId) return animeId;
        const base = animeId.replace(/-dub$/i, '');
        return isDub ? `${base}-dub` : base;
    }, [animeId, isDub]);

    useEffect(() => {
        // auto-load selectedEp for the effective id
        if (effectiveAnimeId && selectedEp) {
            fetchStream(selectedEp);
        }
    }, [effectiveAnimeId, selectedEp]);

    const reloadStream = async () => {
        // Prevent concurrent reloads
        if (reloading) return;
        setReloading(true);
        try {
            // If there's an existing iframe, force a remount by changing key
            setIframeKey((k) => k + 1);

            // Also attempt to re-fetch the stream (in case link expired/slow)
            if (effectiveAnimeId && selectedEp) {
                await fetchStream(selectedEp);
            }
        } finally {
            setReloading(false);
        }
    };

    useEffect(() => {
        // fetch anime details for the Details panel (use effective id)
        const loadDetails = async () => {
            if (!effectiveAnimeId) {
                setDetailsData(null);
                return;
            }
            setDetailsLoading(true);
            setDetailsError(null);
            try {
                const res = await getAnimeDetails(effectiveAnimeId);
                if (!res) throw new Error('No response from details API');
                if (res.error) {
                    const msg = res.message || 'Failed to load details';
                    throw new Error(msg);
                }

                // Normalize response shape to an object we can use
                const raw = res?.data || res || {};
                // common shapes: raw.anime, raw.data.anime, raw
                const info = raw?.anime || raw?.data?.anime || raw?.info || raw;

                // Try to extract common fields
                const title = info?.title || info?.name || info?.animeTitle || info?.anime_name || info?.name_en || null;
                const synopsis = info?.synopsis || info?.description || info?.plot || info?.about || null;
                const image = info?.image || info?.cover || info?.poster || info?.thumbnail || info?.images?.jpg?.image_url || info?.image_url || null;

                // Additional fields requested by user
                const type = info?.type || info?.media_type || info?.format || null;
                const country = info?.country || info?.origin_country || info?.countryOfOrigin || null;
                const status = info?.status || info?.airing_status || null;
                const released = info?.released || info?.year || info?.aired || info?.release_date || null;
                const quality = info?.quality || info?.video_quality || null;

                // rating may be nested
                const rating = info?.rating || info?.scores || info?.score || info?.rating_score || null;
                // Normalize rating shape to { score, votes }
                let ratingObj = null;
                if (rating && typeof rating === 'object') {
                    ratingObj = {
                        score: rating.score ?? rating.score_value ?? rating.value ?? rating.rating ?? rating.score_float ?? null,
                        votes: rating.votes ?? rating.vote_count ?? rating.votes_count ?? rating.voters ?? null,
                    };
                } else if (typeof rating === 'number' || typeof rating === 'string') {
                    ratingObj = { score: Number(rating), votes: null };
                }

                setDetailsData({ title, synopsis, image, type, country, status, released, quality, rating: ratingObj, raw: info });
            } catch (err) {
                console.error('Error loading anime details', err);
                setDetailsError(err.message || 'Failed to load details');
                setDetailsData(null);
            } finally {
                setDetailsLoading(false);
            }
        };

        loadDetails();
    }, [effectiveAnimeId, getAnimeDetails]);

    // fetchStream accepts optional idOverride so toggling mode can fetch immediately
    const fetchStream = async (ep, idOverride) => {
        setFetchError(null);
        setFetchingStream(true);
        try {
            const idToUse = idOverride || effectiveAnimeId || animeId;
            if (!idToUse) throw new Error('Missing anime id');
            const res = await getEpisodeStream(idToUse, ep);
            if (!res) throw new Error('No response from stream API');
            if (res.error) {
                // apiService.apiCall may return an object like { error: true, message: 'HTTP error!...', body: {...} }
                const msg = res.message || (res.body && typeof res.body === 'string' ? res.body : JSON.stringify(res.body || res));
                throw new Error(msg || 'API call failed');
            }
            // API shapes may vary: either { data: { streaming_link: '...' } } or { streaming_link: '...' } or nested deeper
            let link = null;
            if (res.streaming_link) link = res.streaming_link;
            else if (res.data && res.data.streaming_link) link = res.data.streaming_link;
            else if (res.data && Array.isArray(res.data) && res.data[0] && res.data[0].streaming_link) link = res.data[0].streaming_link;

            // also check deeper common shapes: res.data.data.streaming_link
            else if (res.data && res.data.data && res.data.data.streaming_link) link = res.data.data.streaming_link;

            if (!link) throw new Error('Streaming link not found in response');
            setIframeSrc(link);
            setFetchError(null);
        } catch (err) {
            console.error('Failed to fetch stream', err);
            setFetchError(err.message || 'Failed to fetch stream');
            setIframeSrc(null);
        } finally {
            setFetchingStream(false);
        }
    };

    if (loading && episodeCount == null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="w-[89vw] mt-16 -ml-22">
            <div className="grid grid-cols-12 gap-6">
                <aside className="col-span-3 bg-black/60 rounded-lg p-4 max-h-[80vh] overflow-y-auto border border-white/20">
                    <div className="mt-3 flex items-center gap-3">
                        <div className="mb-4 font-semibold">List of episodes:</div>
                        <button onClick={() => navigate(-1)} className="px-3 py-0 bg-white/10 rounded">Back</button>
                    </div>
                    <div>
                        {episodes.length === 0 && <div className="text-gray-400">No episodes available</div>}
                        {episodes.length > 0 && (
                            <div className="grid grid-cols-5 gap-3">
                                {episodes.map((num) => (
                                    <button
                                        key={num}
                                        title={`Episode ${num}`}
                                        onClick={() => { setSelectedEp(num); }}
                                        className={`w-full h-10 flex items-center justify-center rounded-md text-sm font-medium border ${selectedEp === num ? 'bg-pink-600 text-white border-white' : 'bg-black/30 text-gray-200 border-white/10 hover:bg-black/20'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="col-span-6 bg-black/40 rounded-lg p-3 border border-white/20">

                    <div>
                        <div className="w-full h-[60vh] bg-black rounded overflow-hidden flex items-center justify-center relative">
                            {fetchingStream && <LoadingSpinner />}
                            {fetchError && (
                                <div className="text-red-400">{fetchError}</div>
                            )}
                            {!fetchingStream && !fetchError && iframeSrc && (
                                <iframe
                                    key={`iframe-${iframeKey}-${iframeSrc}`}
                                    title={`${animeId}-ep-${selectedEp}`}
                                    src={iframeSrc}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                />
                            )}
                            {!iframeSrc && !fetchingStream && !fetchError && (
                                <div className="text-gray-400">Select an episode to play</div>
                            )}
                        </div>

                        {/* Sub/Dub toggle + Reload button placed under the player */}
                        <div className="w-full flex justify-end items-center gap-3 mt-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (isDub) {
                                            // compute id for sub (remove -dub suffix)
                                            const base = (animeId || '').replace(/-dub$/i, '');
                                            const idToUse = base;
                                            setIsDub(false);
                                            setSelectedEp(1);
                                            // fetch the stream using id override immediately
                                            await fetchStream(1, idToUse);

                                            // update episode counts for this id
                                            try {
                                                const details = await getAnimeDetails(idToUse);
                                                if (details && !details.error) {
                                                    const raw = details?.data || details || {};
                                                    const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
                                                    const epInfo = info?.episodes || info?.stats || {};
                                                    const sub = epInfo?.sub ?? epInfo?.sub_count ?? info?.sub ?? null;
                                                    if (sub && !Number.isNaN(Number(sub))) {
                                                        setEpisodeCount(Number(sub));
                                                    } else {
                                                        const fallback = epInfo?.total || info?.total_episodes || info?.episodesCount || null;
                                                        if (fallback && !Number.isNaN(Number(fallback))) setEpisodeCount(Number(fallback));
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('Failed to update counts for sub id', e);
                                            }
                                        }
                                    }}
                                    className={`px-3 py-1 rounded text-sm ${!isDub ? 'bg-pink-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    Sub
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!isDub) {
                                            // compute id for dub (append -dub)
                                            const base = (animeId || '').replace(/-dub$/i, '');
                                            const idToUse = `${base}-dub`;
                                            setIsDub(true);
                                            setSelectedEp(1);
                                            // fetch the stream using id override immediately
                                            await fetchStream(1, idToUse);

                                            // update episode counts for this dub id
                                            try {
                                                const details = await getAnimeDetails(idToUse);
                                                if (details && !details.error) {
                                                    const raw = details?.data || details || {};
                                                    const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
                                                    const epInfo = info?.episodes || info?.stats || {};
                                                    const sub = epInfo?.sub ?? epInfo?.sub_count ?? info?.sub ?? null;
                                                    if (sub && !Number.isNaN(Number(sub))) {
                                                        setEpisodeCount(Number(sub));
                                                    } else {
                                                        const fallback = epInfo?.total || info?.total_episodes || info?.episodesCount || null;
                                                        if (fallback && !Number.isNaN(Number(fallback))) setEpisodeCount(Number(fallback));
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('Failed to update counts for dub id', e);
                                            }
                                        }
                                    }}
                                    className={`px-3 py-1 rounded text-sm ${isDub ? 'bg-pink-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    Dub
                                </button>
                            </div>

                            <button
                                onClick={reloadStream}
                                title="Reload stream"
                                disabled={reloading}
                                className={`bg-white/10 text-white px-3 py-1 rounded text-sm hover:bg-white/20 shadow-sm ${reloading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {reloading ? 'Reloading...' : 'Reload'}
                            </button>
                        </div>
                    </div>
                </section>

                <aside className="col-span-3 bg-black/60 rounded-lg p-4 overflow-y-auto max-h-[80vh] border border-white/20">
                    {detailsLoading && (
                        <div className="mt-3"><LoadingSpinner /></div>
                    )}

                    {detailsError && (
                        <div className="text-red-400 mt-3">{detailsError}</div>
                    )}

                    {!detailsLoading && !detailsError && detailsData && (
                        <div className="mt-3">
                            {detailsData.image && (
                                <img src={detailsData.image} alt={detailsData.title || animeId} className="w-full rounded mb-3 object-cover" />
                            )}
                            <div className="text-gray-100 font-semibold text-lg">{detailsData.title || animeId}</div>

                            {/* Compact info row */}
                            <div className="text-gray-400 text-sm mt-2 grid grid-cols-2 gap-2">
                                {detailsData.type && <div><span className="font-medium text-gray-200">Type:</span> {detailsData.type}</div>}
                                {detailsData.country && <div><span className="font-medium text-gray-200">Country:</span> {detailsData.country}</div>}
                                {detailsData.status && <div><span className="font-medium text-gray-200">Status:</span> {detailsData.status}</div>}
                                {detailsData.released && <div><span className="font-medium text-gray-200">Released:</span> {detailsData.released}</div>}
                                {detailsData.quality && <div><span className="font-medium text-gray-200">Quality:</span> {detailsData.quality}</div>}
                                {detailsData.rating && (
                                    <div>
                                        <span className="font-medium text-gray-200">Rating:</span>
                                        <span className="ml-1 text-yellow-400">{detailsData.rating.score ?? 'N/A'}</span>
                                        {detailsData.rating.votes != null && (
                                            <span className="text-gray-400 text-xs ml-2">({detailsData.rating.votes} votes)</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {detailsData.synopsis ? (
                                <div className="text-gray-400 text-sm mt-3" style={{ whiteSpace: 'pre-wrap' }}>
                                    {detailsData.synopsis.length > 350 ? `${detailsData.synopsis.slice(0, 350)}...` : detailsData.synopsis}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-sm mt-2">No synopsis available.</div>
                            )}
                        </div>
                    )}

                    {!detailsLoading && !detailsError && !detailsData && (
                        <div className="text-gray-300 mt-2">Anime: {animeId}</div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default StreamingPage;
