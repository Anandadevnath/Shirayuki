import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../context/APIContext';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';

function AnimeDetails() {
  const { animeId } = useParams();
  const navigate = useNavigate();
  const { api, isLoading, error } = useAPI();
  const [animeData, setAnimeData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    if (animeId) fetchAnimeDetails();
  }, [animeId]);

  const fetchAnimeDetails = async () => {
    try {
      const details = await api.getAnimeInfo(animeId);
      setAnimeData(details);

      try {
        const eps = await api.getAnimeEpisodes(animeId);
        setEpisodesData(eps);
      } catch (e) {
        setEpisodesData(null);
      }

      try {
        const home = await api.getHomePage();
        setRecommended(home?.data?.trendingAnimes?.slice(0, 8) || []);
      } catch (e) {
        setRecommended([]);
      }
    } catch (err) {
      console.error('Failed to fetch anime details:', err);
    }
  };

  if (isLoading && !animeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !animeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <ErrorMessage message={error.message} onRetry={fetchAnimeDetails} />
      </div>
    );
  }

  if (!animeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Anime not found</div>
      </div>
    );
  }

  // Normalize a few common API shapes so the template can read values reliably.
  const raw = animeData?.data || animeData || {};
  // The API sometimes nests the useful info under raw.anime.info
  const info = raw?.anime?.info || raw?.anime || raw?.info || raw;
  const moreInfo = raw?.anime?.moreInfo || raw?.moreInfo || info?.moreInfo || {};
  const relatedAnimes = raw?.relatedAnimes || raw?.related || raw?.related_animes || [];
  const recommendedAnimes = raw?.recommendedAnimes || raw?.recommended || raw?.recommended_animes || recommended || [];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden pb-12">
      <header className="bg-black/20 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-xl">h!</span>
              <span className="text-white font-bold text-xl">anime</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 relative overflow-hidden">
              {/* left hero */}
              <div className="flex gap-8">
                <div className="w-64 flex-shrink-0 relative">
                  <img
                    src={poster}
                    alt={name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }}
                    className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
                  />
                  <div className="absolute -bottom-2 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs">Watch2gether</div>
                </div>

                <div className="flex-1 text-white">
                  <h1 className="text-4xl font-extrabold mb-3">{name}</h1>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">{stats?.rating || 'R'}</span>
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">{stats?.quality || 'HD'}</span>
                    <span className="text-gray-300">{stats?.type || info?.type || moreInfo?.type || 'TV'} • {stats?.duration || info?.duration || moreInfo?.duration || '24m'}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-semibold">Play</button>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full">+ Add to list</button>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-4">{info?.description || info?.info?.description || 'No description available.'}</p>

                  <p className="text-gray-400 text-sm mb-6">HiAnime is the best site to watch <span className="text-white font-semibold">{name}</span> SUB online, or you can even watch <span className="text-white font-semibold">{name}</span> DUB in HD quality.</p>

                  <div className="flex items-center gap-4">
                    <button onClick={() => openVideo(info?.promotionalVideos?.[0]?.source)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Watch Trailer</button>
                    <div className="text-sm text-gray-400">{info?.shares || '713'} Shares</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Episodes */}
            <div className="mt-8 bg-black/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
              <h2 className="text-2xl text-white font-bold mb-4">Episodes</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(episodesList || []).slice(0, 12).map((ep, idx) => (
                  <div key={ep.id || ep.number || idx} className="bg-black/20 rounded-xl p-4 border border-white/5 hover:bg-black/30 transition-all">
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

            {/* Promotional Videos */}
            {((info?.promotionalVideos || []).length > 0) && (
              <div className="mt-6 bg-black/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
                <h2 className="text-2xl text-white font-bold mb-4">Promotional Videos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {info.promotionalVideos.map((v, i) => (
                    <button key={v.title || i} onClick={() => openVideo(v.source)} className="group bg-black/20 rounded overflow-hidden">
                      <img src={v.thumbnail} alt={v.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-full h-36 object-cover" />
                      <div className="p-2 text-sm text-white line-clamp-2">{v.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video modal */}
            {videoSrc && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={closeVideo}>
                <div className="w-full max-w-4xl mx-4 bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="relative" style={{paddingTop: '56.25%'}}>
                    <iframe src={videoSrc} title="Trailer" className="absolute inset-0 w-full h-full" frameBorder="0" allowFullScreen />
                  </div>
                  <div className="p-3 text-right"><button onClick={closeVideo} className="text-white px-3 py-1 bg-white/10 rounded">Close</button></div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Japanese:</span>
                  <span className="text-white">{moreInfo?.japanese || info?.jname || info?.otherNames?.[0] || '—'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Aired:</span>
                  <span className="text-white">{moreInfo?.aired || info?.aired || 'Unknown'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Premiered:</span>
                  <span className="text-white">{moreInfo?.premiered || info?.premiered || '—'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{stats?.duration || info?.duration || moreInfo?.duration || '24m'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white">{moreInfo?.status || info?.status || 'Unknown'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">MAL Score:</span>
                  <span className="text-white">{moreInfo?.malscore || info?.malScore || info?.malscore || '—'}</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-gray-400 text-sm mb-2">Genres:</div>
                <div className="flex flex-wrap gap-2">
                  {(moreInfo?.genres || info?.genres || []).map((g, i) => (
                    <span key={`${g}-${i}`} className="bg-gray-700/30 text-white px-3 py-1 rounded-full text-xs">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Most Popular</h3>
              <div className="space-y-3">
                {recommended.map((rec, idx) => (
                  <div key={rec.id || idx} onClick={() => goToAnime(rec)} className="flex items-center gap-3 p-2 hover:bg-black/30 rounded-lg transition-colors cursor-pointer">
                    <div className="text-xl font-bold text-red-500 min-w-[1.5rem]">{idx + 1}</div>
                    <img src={rec.poster || rec.image || '/placeholder-anime.svg'} alt={rec.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-12 h-16 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-semibold line-clamp-2">{rec.name}</h4>
                      <div className="flex gap-1 mt-1">
                        {rec.type && <span className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">{rec.type}</span>}
                        {rec.episodes?.sub && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">{rec.episodes.sub} eps</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-400">Studios: {(moreInfo?.studios || info?.studios) || '—'}</div>
            <div className="text-sm text-gray-400">Producers: {(moreInfo?.producers || info?.producers) ? (moreInfo?.producers || info?.producers).join ? (moreInfo?.producers || info?.producers).join(', ') : (moreInfo?.producers || info?.producers) : '—'}</div>

            {/* Characters & Voice Actors */}
            { (info?.charactersVoiceActors || []).length > 0 && (
              <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Characters & Voice Actors</h3>
                <div className="space-y-3">
                  {info.charactersVoiceActors.map((cva, i) => (
                    <div key={cva.character?.id || cva.voiceActor?.id || i} className="flex items-center gap-3">
                      <img src={cva.character?.poster} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} alt={cva.character?.name} className="w-10 h-10 rounded-full object-cover" />
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

            {/* Related Animes */}
            { (relatedAnimes || []).length > 0 && (
              <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Related</h3>
                <div className="grid grid-cols-3 gap-3">
                  {relatedAnimes.slice(0,9).map((r, i) => (
                    <button key={r.id || i} onClick={() => goToAnime(r)} className="group">
                      <img src={r.poster || r.image || '/placeholder-anime.svg'} alt={r.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-anime.svg'; }} className="w-full h-28 object-cover rounded" />
                      <div className="text-xs text-gray-300 mt-1 line-clamp-2">{r.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AnimeDetails;