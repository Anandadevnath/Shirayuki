import React, { useEffect, useState, useRef } from 'react';
import Hls from 'hls.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../context/APIContext';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';

function Episodes() {
  const { animeId } = useParams();
  const navigate = useNavigate();
  const { api, isLoading, error } = useAPI();
  const [episodesData, setEpisodesData] = useState([]);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [selectedEp, setSelectedEp] = useState(null);
  const [playingSource, setPlayingSource] = useState(null);
  const [sources, setSources] = useState([]);
  const [servers, setServers] = useState([]);
  const [serversError, setServersError] = useState(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const playerRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (animeId) {
      fetchEpisodes();
      fetchAnimeInfo();
    }
  }, [animeId]);

  const fetchAnimeInfo = async () => {
    try {
      const res = await api.getAnimeInfo(animeId);
      const raw = res?.data || res || {};
      const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
      setAnimeInfo(info);
    } catch (err) {
      console.error('Failed to fetch anime info', err);
      setAnimeInfo(null);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await api.getAnimeEpisodes(animeId);
      const list = res?.data?.episodes || res?.episodes || res || [];
      setEpisodesData(list);
    } catch (err) {
      console.error('Failed to fetch episodes', err);
      setEpisodesData([]);
    }
  };

  const onSelectEpisode = async (ep) => {
    setSelectedEp(ep);
    setLoadingSources(true);
    setPlayingSource(null);
    try {
      const episodeId = ep.id || ep._id || ep.episodeId || ep.linkId || ep.number;
      await fetchStreamsForEpisode(episodeId);
    } catch (err) {
      console.error('Failed to fetch streaming links', err);
      // Try to get server list so user can retry with a server
      try {
        const episodeId = ep.id || ep._id || ep.episodeId || ep.linkId || ep.number;
        const serversRes = await api.getEpisodeServers(episodeId);
        const srv = serversRes?.data?.servers || serversRes?.servers || serversRes || [];
        setServers(Array.isArray(srv) ? srv : []);
        setServersError(null);
      } catch (sErr) {
        console.error('Failed to fetch episode servers', sErr);
        setServers([]);
        setServersError(sErr.message || 'Failed to load servers');
      }
    } finally {
      setLoadingSources(false);
    }
  };

  // Try to fetch streams for an episode and play the dub if available
  const onPlayDubEpisode = async (ep) => {
    setSelectedEp(ep);
    setLoadingSources(true);
    setPlayingSource(null);
    try {
      const episodeId = ep.id || ep._id || ep.episodeId || ep.linkId || ep.number;
      const list = await fetchStreamsForEpisode(episodeId);
      const dub = list.find(isDubSource);
      if (dub) {
        const candidate = dub.file || dub.url || dub.link || dub.src;
        if (candidate) setPlayingSource(maybeProxy(candidate));
      } else {
        setServersError('No dub source found for this episode');
        // keep sources visible so user can choose
      }
    } catch (err) {
      console.error('Failed to fetch streams for dub', err);
      setServersError(err.message || 'Failed fetching streams');
    } finally {
      setLoadingSources(false);
    }
  };

  const fetchStreamsForEpisode = async (episodeId, server = null, category = null) => {
    setLoadingSources(true);
    try {
      const res = await api.getEpisodeStreamingLinks(episodeId, server, category);
      const s = res?.data?.sources || res?.sources || res || [];
      const list = Array.isArray(s) ? s : (typeof s === 'object' ? Object.values(s) : []);
      setSources(list);
      setServers([]); // clear server list on success
      // pick first playable
      const first = list[0];
      const candidate = first?.file || first?.url || first?.link || first?.src || (typeof list === 'object' && Object.values(list)[0]?.file);
      if (candidate) setPlayingSource(maybeProxy(candidate));
      return list;
    } catch (err) {
      setSources([]);
      setPlayingSource(null);
      throw err;
    } finally {
      setLoadingSources(false);
    }
  };

  // Proxy configuration: prefer Vite env var or default to the IP used in your proxy.js
  // proxy.js logs show access via http://192.168.10.138:8081 so we default to that to match its rewriting
  const PROXY_BASE = import.meta.env.VITE_PLAYER_PROXY || 'http://192.168.10.138:8081';

  // Decide whether to route a source through the CORS proxy.
  const maybeProxy = (src) => {
    if (!src) return src;
    try {
      const lc = src.toLowerCase();
      // Keep YouTube embeds direct (iframe friendly)
      if (lc.includes('youtube') || lc.includes('youtu.be')) return src;
      // Relative/internal URLs don't need proxying
      if (src.startsWith('/') || src.startsWith(window.location.origin)) return src;
      // Already proxied
      if (src.startsWith(PROXY_BASE)) return src;
      // Use proxy to avoid CORS issues
      return `${PROXY_BASE}?url=${encodeURIComponent(src)}`;
    } catch (e) {
      return src;
    }
  };

  // Attach HLS.js to the video element when the playing source is an HLS playlist (.m3u8)
  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;

    const src = playingSource;
    // destroy previous hls instance if any
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
      hlsRef.current = null;
    }

    if (!src) {
      // clear video src
      try { video.removeAttribute('src'); video.load(); } catch (e) {}
      return;
    }

    const lc = src.toLowerCase();
    const isM3U8 = lc.includes('.m3u8');

    if (isM3U8) {
      // If browser supports native HLS (Safari), set proxied src directly
      const proxied = src.startsWith(PROXY_BASE) ? src : `${PROXY_BASE}?url=${encodeURIComponent(src)}`;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxied;
        video.load();
        video.play().catch(() => {});
      } else if (Hls.isSupported()) {
        // Create a custom loader that forces every request through the proxy
        const ProxyLoader = class extends Hls.DefaultConfig.loader {
          constructor(config) { super(config); }
          load(context, config, callbacks) {
            try {
              if (!context.url.startsWith(PROXY_BASE)) {
                context.url = `${PROXY_BASE}?url=${encodeURIComponent(context.url)}`;
              }
            } catch (e) {
              // fall back to original URL on error
            }
            super.load(context, config, callbacks);
          }
        };

        const hls = new Hls({ loader: ProxyLoader });
        hlsRef.current = hls;
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // try autoplay when manifest parsed
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error', event, data);
          if (data && data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // try to recover network error
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                try { hls.destroy(); } catch (e) {}
                break;
            }
          }
        });

        try { hls.loadSource(proxied); } catch (e) { console.error('HLS loadSource error', e); }
      } else {
        console.warn('HLS stream but HLS is not supported in this browser');
      }
    } else {
      // Non-HLS: set video src normally
      try {
        video.src = src;
        video.load();
        // attempt autoplay (may be blocked by browser policy)
        video.play().catch(() => {});
      } catch (e) {
        console.error('Error setting video src', e);
      }
    }

    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) {}
        hlsRef.current = null;
      }
    };
  }, [playingSource]);

  if (isLoading && !episodesData.length) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>
  );

  if (error && !episodesData.length) return (
    <div className="min-h-screen p-6"><ErrorMessage message={error.message} onRetry={fetchEpisodes} /></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Left: numbered grid */}
        <aside className="col-span-3 bg-black/30 rounded-lg p-4 h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">List of episodes</div>
            <div className="text-xs text-gray-400">EPS: {episodesData.length || '—'}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {episodesData.map((ep, i) => (
              <div key={ep.id || ep._id || i}>
                <button
                  onClick={() => onSelectEpisode(ep)}
                  className={`w-full h-12 flex items-center justify-center rounded ${selectedEp?.id === ep.id || selectedEp?._id === ep._id ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-200'} hover:scale-105 transition`}
                >
                  {ep.number || ep.episode || i + 1}
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: player */}
        <main className="col-span-6 bg-black/20 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">Player</div>
            <div className="text-xs text-gray-400">Auto Play On</div>
          </div>

          <div className="flex-1 bg-black rounded-md overflow-hidden flex items-center justify-center">
            {playingSource ? (
              // if youtube or embed use iframe
              (playingSource.includes('youtube') || playingSource.includes('youtu.be')) ? (
                <iframe title="player" src={playingSource} className="w-full h-full" frameBorder="0" allowFullScreen />
              ) : (
                <video ref={playerRef} controls className="w-full h-full bg-black">
                  <source src={playingSource} />
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="text-gray-400">Select an episode to play</div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
            <div>{selectedEp ? `Now playing: Episode ${selectedEp.number || selectedEp.episode || '—'}` : 'No episode selected'}</div>
            <div>{loadingSources ? 'Loading sources...' : `${sources.length} sources`}</div>
          </div>
        </main>

        {/* Right: info */}
        <aside className="col-span-3 bg-black/20 rounded-lg p-4 h-[80vh] overflow-auto">
          <button className="mb-4 text-sm text-blue-300" onClick={() => navigate(-1)}>← Back</button>

          <div className="flex items-start gap-4">
            <img src={animeInfo?.poster || animeInfo?.image || '/placeholder-anime.svg'} alt={animeInfo?.name || animeId} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-24 h-32 object-cover rounded" />
            <div className="flex-1">
              <div className="text-white font-bold text-lg">{animeInfo?.name || animeId}</div>
              <div className="flex gap-2 mt-2">
                <span className="bg-white/10 text-white px-2 py-1 rounded text-xs">{animeInfo?.stats?.rating || 'PG-13'}</span>
                <span className="bg-white/10 text-white px-2 py-1 rounded text-xs">{animeInfo?.stats?.quality || 'HD'}</span>
                <span className="text-gray-300 text-xs">{animeInfo?.stats?.episodes?.sub || '—'} / {animeInfo?.stats?.episodes?.dub || '—'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-300 leading-relaxed">{(animeInfo?.description || '').slice(0, 300)}{(animeInfo?.description || '').length > 300 ? '...' : ''}</div>

          <div className="mt-4">
            <button onClick={() => navigate(`/anime/${animeId}`)} className="bg-white/10 text-white px-3 py-2 rounded">View detail</button>
          </div>

          <div className="mt-6 text-sm text-gray-400">Studios: {animeInfo?.moreInfo?.studios || animeInfo?.studios || '—'}</div>
          <div className="mt-2 text-sm text-gray-400">Producers: {Array.isArray(animeInfo?.moreInfo?.producers || animeInfo?.producers) ? (animeInfo?.moreInfo?.producers || animeInfo?.producers).join(', ') : (animeInfo?.moreInfo?.producers || animeInfo?.producers || '—')}</div>

          {/* Source list with play buttons */}
          <div className="mt-6">
            <div className="text-sm text-gray-300 mb-2">Available sources</div>
            <div className="space-y-2">
              {sources.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-black/30 rounded">
                  <div className="text-sm">{s.server || s.name || `Source ${i + 1}`}</div>
                  <button onClick={() => setPlayingSource(maybeProxy(s.file || s.url || s.link || s.src))} className="text-xs bg-pink-500 px-2 py-1 rounded">Play</button>
                </div>
              ))}
              {!sources.length && <div className="text-gray-500 text-sm">No sources loaded</div>}
            </div>
          </div>

          {servers.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-300 mb-2">Available servers</div>
              <div className="space-y-2">
                {servers.map((sv, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-black/30 rounded">
                    <div className="text-sm">{sv.name || sv.server || `Server ${i + 1}`}</div>
                    <button onClick={async () => {
                      const episodeId = selectedEp?.id || selectedEp?._id || selectedEp?.episodeId || selectedEp?.linkId || selectedEp?.number;
                      try { await fetchStreamsForEpisode(episodeId, sv.server || sv.name); } catch (e) { console.error(e); }
                    }} className="text-xs bg-green-600 px-2 py-1 rounded">Try</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {serversError && (
            <div className="mt-4 text-sm text-red-400">{serversError}</div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Episodes;
