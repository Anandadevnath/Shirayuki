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

    useEffect(() => {
        // auto-load selectedEp
        if (animeId && selectedEp) {
            fetchStream(selectedEp);
        }
    }, [animeId, selectedEp]);

    const fetchStream = async (ep) => {
        setFetchError(null);
        setFetchingStream(true);
        try {
            if (!animeId) throw new Error('Missing anime id');
            const res = await getEpisodeStream(animeId, ep);
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

            // Some returned links may be base64 or embed tokens; use as-is in iframe src
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

                    <div className="w-full h-[60vh] bg-black rounded overflow-hidden flex items-center justify-center">
                        {fetchingStream && <LoadingSpinner />}
                        {fetchError && (
                            <div className="text-red-400">{fetchError}</div>
                        )}
                        {!fetchingStream && !fetchError && iframeSrc && (
                            <iframe
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
                </section>

                <aside className="col-span-3 bg-black/60 rounded-lg p-4 overflow-y-auto max-h-[80vh] border border-white/20">
                    <div className="font-bold text-lg">Details</div>
                    <div className="text-gray-300 mt-2">Anime: {animeId}</div>
                    <div className="text-gray-400 text-sm mt-4">If stream doesn't load, try another episode or check the console for error details.</div>
                </aside>
            </div>
        </div>
    );
}

export default StreamingPage;
