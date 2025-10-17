import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShirayukiAPI } from '../context';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';

function AnimeDetails() {
  const { animeId } = useParams();
  // Support navigation by title/slug
  const resolvedId = animeId;
  const navigate = useNavigate();
  const { getAnimeDetails, getHomepage, loading, error, clearError } = useShirayukiAPI();
  const [animeData, setAnimeData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    if (resolvedId) fetchAnimeDetails();
  }, [resolvedId]);

  const fetchAnimeDetails = async () => {
    try {
      const details = await getAnimeDetails(resolvedId);
      setAnimeData(details);
      setEpisodesData(null);
      try {
        const home = await getHomepage();
        setRecommended(home?.data?.trendingAnimes?.slice(0, 8) || []);
      } catch (e) {
        setRecommended([]);
      }
    } catch (err) {
      console.error('Failed to fetch anime details:', err);
    }
  };

  if (loading && !animeData) {
    return (
      <div
        className="home-full-bg relative overflow-x-hidden"
        style={{ background: '#000000' }}
      >
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }
  if (error && !animeData) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={fetchAnimeDetails} />
      </div>
    );
  }

  if (!animeData) {
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

  // Extract additional info for sidebar display
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

  // episodes list may come from the episodes endpoint or be embedded in the details
  const episodesList = episodesData?.data?.episodes || episodesData?.episodes || info?.episodesList || [];

  const openVideo = (src) => setVideoSrc(src);
  const closeVideo = () => setVideoSrc(null);

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
            <div className="bg-black rounded-2xl border border-white/10 p-0 relative overflow-hidden shadow-2xl">
              <div className="relative w-full h-[680px] rounded-2xl overflow-hidden">
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
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute left-6 top-6 bottom-6 right-6 lg:right-6 flex flex-col gap-6 text-white">
                  <div>
                    <h1 className="text-4xl font-extrabold mb-3 drop-shadow">{name}</h1>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">{stats?.quality || 'HD'}</span>
                      <span className="text-gray-200">{stats?.type || info?.type || moreInfo?.type || 'TV'} • {stats?.duration || info?.duration || moreInfo?.duration || '24m'}</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <div className="max-w-full md:max-w-[60%]">
                      <p className="text-gray-200 leading-relaxed mb-4 line-clamp-6">{info?.description || info?.info?.description || 'No description available.'}</p>
                      <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/anime/${resolveId(info)}/episodes`)} className="bg-white hover:bg-fuchsia-100 text-black px-6 py-2 rounded-xl font-semibold">Play</button>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full">+ Add to list</button>
                      </div>

                      <div className="hidden lg:block mt-6">
                        <div className="text-black">
                          <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-100 text-lg">Type:</span><span className="text-md bg-black/30 text-white px-3 py-1 rounded-full">{type}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-lg">Country:</span><span className=" text-md bg-black/30 text-white px-3 py-1 rounded-full">{country}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-lg">Status:</span><span className=" text-md bg-black/30 text-white px-3 py-1 rounded-full">{status}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-lg">Released:</span><span className=" text-md bg-black/30 text-white px-3 py-1 rounded-full">{released}</span></div>
                            <div className="flex justify-between"><span className="text-gray-100 text-lg">Quality:</span><span className="text-md bg-black/30 text-white px-3 py-1 rounded-full">{quality}</span></div>
                          </div>
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                              <div className="text-gray-100 text-lg mb-2">Genres:</div>
                              {genres.map((g, i) => (
                                <span key={`${g}-${i}`} className="bg-black/30 text-white px-3 py-1 rounded-full text-md">{g}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-40 h-56 rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden md:block">
                      <img src={poster} alt={name} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Episodes */}
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

          {/* Characters & Voice Actors (moved below main content) */}
          {(info?.charactersVoiceActors || []).length > 0 && (
            <div className="bg-black rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Characters & Voice Actors</h3>
              <div className="space-y-3">
                {info.charactersVoiceActors.map((cva, i) => (
                  <div key={cva.character?.id || cva.voiceActor?.id || i} className="flex items-center gap-3">
                    <img src={pickBestImage(cva.character || {}, {})} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} alt={cva.character?.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{cva.character?.name}</div>
                      <div className="text-gray-400 text-xs">{cva.character?.cast}</div>
                      <div className="text-gray-300 text-xs mt-1">VA: {cva.voiceActor?.name} <span className="text-gray-400 text-xs">({cva.voiceActor?.cast})</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Animes (moved below main content) */}
          {(relatedAnimes || []).length > 0 && (
            <div className="bg-black rounded-2xl border border-white/10 p-6 shadow-xl w-full mx-auto" style={{ maxWidth: '100vw' }}>
              <h3 className="text-2xl font-bold text-white mb-6">Related Anime</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
                {relatedAnimes.slice(0, 10).map((r, i) => (
                  <button
                    key={r.id || i}
                    onClick={() => goToAnime(r)}
                    className="group flex flex-col items-center bg-gray-900 hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-700 transition-all duration-300 rounded-xl border border-white/10 shadow-lg p-3 cursor-pointer"
                    style={{ minHeight: '260px', height: '260px', maxWidth: '180px', width: '100%' }}
                  >
                    <img
                      src={pickBestImage(r, r)}
                      alt={r.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }}
                      className="w-full h-32 object-cover rounded-lg mb-3 shadow"
                      style={{ maxWidth: '120px', height: '128px' }}
                    />
                    <div className="text-sm text-white font-semibold text-center line-clamp-2 mb-1 group-hover:text-pink-200 transition-colors">
                      {r.name}
                    </div>
                    {r.type && (
                      <span className="bg-pink-600/80 text-white px-2 py-0.5 rounded-full text-xs font-semibold mb-1">{r.type}</span>
                    )}
                    {r.episodes?.sub && (
                      <span className="bg-blue-600/80 text-white px-2 py-0.5 rounded-full text-xs font-semibold mb-1">{r.episodes.sub} eps</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AnimeDetails;