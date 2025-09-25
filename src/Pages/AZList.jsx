import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchAZList } from '../context/api/apiClient';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const PAGE_SIZE = 24;

export default function AZList() {
    const query = useQuery();
    const sort = query.get('sort') || 'All';
    const [page, setPage] = useState(1);
    const [animes, setAnimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetchAZList(sort, page)
            .then(data => {
                console.log('AZList API response:', data); // Debug log
                let animeList = [];
                if (data && data.data && Array.isArray(data.data.animes)) {
                    animeList = data.data.animes;
                }
                setAnimes(animeList);
                // If pagination info is available, set it here. Otherwise, default to 1.
                setTotalPages(data.data?.lastPage || data.data?.totalPages || 1);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sort, page]);

    // A-Z options
    const azOptions = [
        "All", "#", "0-9",
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    ];

    const handleAZClick = (option) => {
        window.location.href = `/a-zlist?sort=${encodeURIComponent(option)}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="font-bold text-white text-lg mb-2">A-Z LIST</div>
                <div className="text-gray-400 mb-2">Searching anime order by alphabet name A to Z.</div>
                <div className="flex flex-wrap gap-2">
                    {azOptions.map((option) => (
                        <button
                            key={option}
                            className={`az-btn px-3 py-1 rounded bg-gray-700 text-white hover:bg-pink-500 transition${sort === option ? ' ring-2 ring-pink-400' : ''}`}
                            onClick={() => handleAZClick(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Anime List: {sort}</h2>

            <div className="flex justify-center mt-2 mb-8 gap-2">
                <button
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                >
                    Prev
                </button>
                <span className="px-3 py-1 text-white">Page {page} of {totalPages}</span>
                <button
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : Array.isArray(animes) ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {animes.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400">No anime found.</div>
                    ) : (
                        animes.map(anime => (
                            <div key={anime.id || anime._id || anime.slug || anime.name} className="bg-gray-800 rounded p-2 flex flex-col items-center relative">
                                <div className="relative w-full">
                                    <img src={anime.poster || anime.image || anime.cover} alt={anime.name} className="w-full h-48 object-cover rounded mb-2" />
                                    {(anime.episodes?.sub || anime.episodes?.dub) && (
                                        <div className="flex gap-2 absolute bottom-2 left-2">
                                            {typeof anime.episodes?.sub !== 'undefined' && anime.episodes.sub !== null && (
                                                <span className="flex items-center bg-green-200 text-black text-xs font-semibold px-2 py-1 rounded shadow">
                                                    <span className="bg-black text-green-200 rounded px-1 mr-1 font-bold" style={{ fontSize: '0.85em' }}>cc</span> {anime.episodes.sub}
                                                </span>
                                            )}
                                            {typeof anime.episodes?.dub !== 'undefined' && anime.episodes.dub !== null && (
                                                <span className="flex items-center bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                                    {anime.episodes.dub}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-white text-sm font-semibold text-center mt-2 truncate w-full">{anime.name}</div>
                                <div className="text-gray-400 text-xs text-center w-full">{anime.type} • {anime.duration}</div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="col-span-full text-center text-red-400">API response error: No anime array found.</div>
            )}
            <div className="flex justify-center mt-6 gap-2">
                <button
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                >
                    Prev
                </button>
                <span className="px-3 py-1 text-white">Page {page} of {totalPages}</span>
                <button
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
