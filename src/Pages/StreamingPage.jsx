import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner } from '../components/LoadingStates';
import EpisodeList from '../components/EpisodeList';
import VideoPlayer from '../components/VideoPlayer';
import Hls from 'hls.js';

function StreamingPage() {
    const { animeId } = useParams();
    const { getEpisodeStream, getAnimeDetails, getHomepage, getRecentUpdates, loading } = useShirayukiAPI();
    const location = useLocation();
    const [episodeCount, setEpisodeCount] = useState(null);
    const [selectedEp, setSelectedEp] = useState(1);
    const [iframeSrc, setIframeSrc] = useState(null);
    const videoRef = useRef(null);
    const [fetchError, setFetchError] = useState(null);
    const [fetchingStream, setFetchingStream] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [reloading, setReloading] = useState(false);
    const [isDub, setIsDub] = useState(() => animeId?.toLowerCase().includes('dub') || false);
    const [currentEpisodeHasDub, setCurrentEpisodeHasDub] = useState(false);
    const [animeData, setAnimeData] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchAnimeData = async () => {
            if (!animeId) return;
            
            try {
                console.log('🔄 Fetching recent_updates data...');
                const recent = await getRecentUpdates();
                const recentList = recent?.data || [];
                console.log('📋 Recent list length:', recentList.length);
                
                const slugify = (str) => {
                    if (!str) return '';
                    return String(str)
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                        .replace(/--+/g, '-');
                };
                
                const currentAnimeSlug = slugify(animeId);
                console.log('🎯 Looking for currentAnimeSlug:', currentAnimeSlug);
                
                const match = recentList.find((item) => {
                    const titleSlug = slugify(String(item?.title || ''));
                    const isMatch = titleSlug === currentAnimeSlug;
                    
                    if (isMatch) {
                        console.log('✅ Found match!', {
                            item_title: item?.title,
                            item_japanese_title: item?.japanese_title,
                            titleSlug: titleSlug,
                            currentAnimeSlug: currentAnimeSlug
                        });
                    }
                    
                    return isMatch;
                });
                
                console.log('🎯 Match result:', match);
                
                if (mounted && match) {
                    console.log('🎯 Found anime data:', {
                        title: match.title,
                        japanese: match.japanese,
                        japanese_title: match.japanese_title,
                        originalAnimeId: animeId
                    });
                    setAnimeData(match);
                    
                    const hasDubVersion = !!match.title;
                    const hasSubVersion = !!(match.japanese_title || match.japanese);
                    
                    console.log('🎭 Version availability:', {
                        hasDubVersion: hasDubVersion,
                        hasSubVersion: hasSubVersion,
                        currentIsDub: animeId?.toLowerCase().includes('dub')
                    });
                } else {
                    console.log('❌ No match found');
                }
            } catch (error) {
                console.error('Failed to fetch anime data from recent_updates:', error);
            }
        };
        
        fetchAnimeData();
        return () => { mounted = false; };
    }, [animeId, getRecentUpdates]);

    // Check if current episode has dub version available
    useEffect(() => {
        const checkCurrentEpisodeDub = async () => {
            if (!animeData || !animeData.title) {
                setCurrentEpisodeHasDub(false);
                return;
            }

            try {
                console.log(`🔍 Checking if episode ${selectedEp} has dub version...`);
                let dubTitle = animeData.title;
                // Add "-dub" suffix if it doesn't already exist
                if (!dubTitle.toLowerCase().includes('dub')) {
                    dubTitle = `${dubTitle}-dub`;
                }
                const res = await getEpisodeStream(dubTitle, selectedEp);
                
                let hasLink = false;
                if (res && !res.error) {
                    let link = null;
                    if (res.streaming_link) link = res.streaming_link;
                    else if (res.data && res.data.streaming_link) link = res.data.streaming_link;
                    else if (res.data && Array.isArray(res.data) && res.data[0] && res.data[0].streaming_link) link = res.data[0].streaming_link;
                    else if (res.data && res.data.data && res.data.data.streaming_link) link = res.data.data.streaming_link;
                    
                    hasLink = !!link;
                }
                
                console.log(`📺 Episode ${selectedEp} dub availability:`, hasLink);
                setCurrentEpisodeHasDub(hasLink);
                
                // If current episode doesn't have dub but we're in dub mode, switch to sub
                if (!hasLink && isDub) {
                    console.log(`⚠️ Episode ${selectedEp} has no dub, switching to sub`);
                    setIsDub(false);
                }
                
            } catch (error) {
                console.warn(`Failed to check dub for episode ${selectedEp}:`, error);
                setCurrentEpisodeHasDub(false);
                if (isDub) {
                    setIsDub(false);
                }
            }
        };

        // Only check if we have anime data
        if (animeData) {
            checkCurrentEpisodeDub();
        }
    }, [selectedEp, animeData, getEpisodeStream, isDub]);

    // Helper function for slugifying strings
    const slugify = (str) => {
        if (!str) return '';
        return String(str)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/--+/g, '-');
    };

    // Load episode count
    useEffect(() => {
        const navSub = location?.state?.subCount;
        if (navSub && !Number.isNaN(Number(navSub))) {
            setEpisodeCount(Number(navSub));
            return;
        }

        const loadCounts = async () => {
            if (!animeId) {
                setEpisodeCount(0);
                return;
            }

            // Try recent_updates first
            try {
                const recent = await getRecentUpdates();
                const recentList = recent?.data || [];
                const normalizedResolved = slugify(animeId.replace(/-dub$/i, ''));
                const match = recentList.find((item) => {
                    const titles = [item?.slug, item?.id, item?.animeId, item?.title, item?.japanese, item?.name, item?._id];
                    return titles.some((t) => slugify(String(t || '')) === normalizedResolved);
                });
                if (match && match.sub && !Number.isNaN(Number(match.sub))) {
                    setEpisodeCount(Number(match.sub));
                    return;
                }
            } catch (e) {
                console.warn('Failed to use recent_updates counts', e);
            }

            // Fallback to homepage
            try {
                const home = await getHomepage();
                const list = home?.data || [];
                const trendingItems = list.filter((a) => a.section === 'trending');
                const candidates = trendingItems.length ? trendingItems : list;
                const normalizedResolved = slugify(animeId.replace(/-dub$/i, ''));
                const match = candidates.find((a) => {
                    const candidateSlugs = [a.slug, a.id, a.animeId, a.title, a.japanese, a._id].filter(Boolean);
                    return candidateSlugs.some((v) => slugify(String(v || '')) === normalizedResolved);
                });
                if (match && match.sub && !Number.isNaN(Number(match.sub))) {
                    setEpisodeCount(Number(match.sub));
                    return;
                }
            } catch (e) {
                console.warn('Failed to use homepage counts', e);
            }

            // Fallback to details
            try {
                const details = await getAnimeDetails(animeId);
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
    }, [animeId, getAnimeDetails, getHomepage, getRecentUpdates, location?.state, slugify]);

    const episodes = useMemo(() => {
        const count = Number(episodeCount) || 0;
        return Array.from({ length: count }, (_, i) => i + 1);
    }, [episodeCount]);

    const effectiveAnimeId = useMemo(() => {
        if (!animeData) {
            console.log('⚠️ No animeData, falling back to animeId:', animeId);
            return animeId; // Fallback to original if no data
        }
        
        if (isDub) {
            // Use regular title for dub and add "-dub" suffix if not present
            let dubTitle = animeData.title || animeId;
            if (!dubTitle.toLowerCase().includes('dub')) {
                dubTitle = `${dubTitle}-dub`;
            }
            console.log('🎭 Using DUB title:', dubTitle);
            return dubTitle;
        } else {
            // Use japanese title for sub, but remove any "dub" suffix
            let subTitle = animeData.japanese_title || animeData.japanese || animeId;
            
            // Remove "dub" suffix from the title (case insensitive)
            subTitle = subTitle.replace(/\s*-?dub\s*$/i, '').trim();
            
            console.log('🗾 Using SUB title (cleaned):', subTitle);
            return subTitle;
        }
    }, [animeData, isDub, animeId]);

    useEffect(() => {
        if (effectiveAnimeId && selectedEp) {
            fetchStream(selectedEp);
        }
    }, [effectiveAnimeId, selectedEp]);

    // HLS.js player setup
    useEffect(() => {
        if (iframeSrc && videoRef.current && iframeSrc.endsWith('.m3u8')) {
            let hls;
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(iframeSrc);
                hls.attachMedia(videoRef.current);
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = iframeSrc;
            }
            return () => {
                if (hls) hls.destroy();
            };
        }
    }, [iframeSrc]);

    const reloadStream = async () => {
        if (reloading) return;
        setReloading(true);
        try {
            setIframeKey((k) => k + 1);
            if (effectiveAnimeId && selectedEp) {
                await fetchStream(selectedEp);
            }
        } finally {
            setReloading(false);
        }
    };



    // fetchStream accepts optional idOverride so toggling mode can fetch immediately
    const fetchStream = async (ep, idOverride) => {
        setFetchError(null);
        setFetchingStream(true);
        try {
            const idToUse = idOverride || effectiveAnimeId || animeId;
            if (!idToUse) throw new Error('Missing anime id');
            
            console.log('🎬 fetchStream called with:', {
                episode: ep,
                idOverride: idOverride,
                effectiveAnimeId: effectiveAnimeId,
                finalIdToUse: idToUse,
                isDub: isDub
            });
            
            const res = await getEpisodeStream(idToUse, ep);
            if (!res) throw new Error('No response from stream API');
            if (res.error) {
                const msg = res.message || (res.body && typeof res.body === 'string' ? res.body : JSON.stringify(res.body || res));
                throw new Error(msg || 'API call failed');
            }
            let link = null;
            if (res.streaming_link) link = res.streaming_link;
            else if (res.data && res.data.streaming_link) link = res.data.streaming_link;
            else if (res.data && Array.isArray(res.data) && res.data[0] && res.data[0].streaming_link) link = res.data[0].streaming_link;
            else if (res.data && res.data.data && res.data.data.streaming_link) link = res.data.data.streaming_link;

            if (!link) throw new Error('Streaming link not found in response');
            setIframeSrc(link);
            setFetchError(null);
            console.log('✅ Successfully fetched stream link');
        } catch (err) {
            console.error('Failed to fetch stream', err);
            setFetchError(err.message || 'Failed to fetch stream');
            setIframeSrc(null);
        } finally {
            setFetchingStream(false);
        }
    };

    const handleEpisodeSelect = (episodeNumber) => {
        setSelectedEp(episodeNumber);
    };

    const handleSubDubToggle = async (mode) => {
        if (mode === 'sub' && isDub && animeData) {
            let subTitle = animeData.japanese_title || animeData.japanese || animeId;
            subTitle = subTitle.replace(/\s*-?dub\s*$/i, '').trim();
            setIsDub(false);
            console.log('🔄 Switching to SUB using title:', subTitle);
            await fetchStream(selectedEp, subTitle);
        } else if (mode === 'dub' && !isDub && animeData) {
            let dubTitle = animeData.title || animeId;
            if (!dubTitle.toLowerCase().includes('dub')) {
                dubTitle = `${dubTitle}-dub`;
            }
            setIsDub(true);
            console.log('🔄 Switching to DUB using title:', dubTitle);
            await fetchStream(selectedEp, dubTitle);
        }
    };

    if (loading && episodeCount == null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <LoadingSpinner size="large" />
                    <div className="text-white text-lg">Loading anime data...</div>
                    <div className="text-gray-400 text-sm">Please wait while we prepare your content</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 px-6">
            <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-12 gap-6">
                <EpisodeList 
                    episodes={episodes}
                    selectedEp={selectedEp}
                    onEpisodeSelect={handleEpisodeSelect}
                />

                <div className="col-span-9">
                    <VideoPlayer
                    animeId={animeId}
                    selectedEp={selectedEp}
                    iframeSrc={iframeSrc}
                    fetchingStream={fetchingStream}
                    fetchError={fetchError}
                    iframeKey={iframeKey}
                    videoRef={videoRef}
                    isDub={isDub}
                    currentEpisodeHasDub={currentEpisodeHasDub}
                    reloading={reloading}
                    onSubDubToggle={handleSubDubToggle}
                    onReload={reloadStream}
                    />
                </div>
            </div>
            </div>
        </div>
    );
}

export default StreamingPage;