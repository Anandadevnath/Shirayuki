import React from 'react';
import { LoadingSpinner } from './LoadingStates';

function AnimeInfo({ 
    animeId, 
    detailsLoading, 
    detailsError, 
    detailsData 
}) {
    return (
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
                        <img 
                            src={detailsData.image} 
                            alt={detailsData.title || animeId} 
                            className="w-full rounded mb-3 object-cover" 
                        />
                    )}
                    <div className="text-gray-100 font-semibold text-lg">
                        {detailsData.title || animeId}
                    </div>

                    {/* Compact info row */}
                    <div className="text-gray-400 text-sm mt-2 grid grid-cols-2 gap-2">
                        {detailsData.type && (
                            <div>
                                <span className="font-medium text-gray-200">Type:</span> {detailsData.type}
                            </div>
                        )}
                        {detailsData.country && (
                            <div>
                                <span className="font-medium text-gray-200">Country:</span> {detailsData.country}
                            </div>
                        )}
                        {detailsData.status && (
                            <div>
                                <span className="font-medium text-gray-200">Status:</span> {detailsData.status}
                            </div>
                        )}
                        {detailsData.released && (
                            <div>
                                <span className="font-medium text-gray-200">Released:</span> {detailsData.released}
                            </div>
                        )}
                        {detailsData.quality && (
                            <div>
                                <span className="font-medium text-gray-200">Quality:</span> {detailsData.quality}
                            </div>
                        )}
                        {detailsData.rating && (
                            <div>
                                <span className="font-medium text-gray-200">Rating:</span>
                                <span className="ml-1 text-yellow-400">
                                    {detailsData.rating.score ?? 'N/A'}
                                </span>
                                {detailsData.rating.votes != null && (
                                    <span className="text-gray-400 text-xs ml-2">
                                        ({detailsData.rating.votes} votes)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {detailsData.synopsis ? (
                        <div className="text-gray-400 text-sm mt-3" style={{ whiteSpace: 'pre-wrap' }}>
                            {detailsData.synopsis.length > 350 
                                ? `${detailsData.synopsis.slice(0, 350)}...` 
                                : detailsData.synopsis
                            }
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm mt-2">
                            No synopsis available.
                        </div>
                    )}
                </div>
            )}

            {!detailsLoading && !detailsError && !detailsData && (
                <div className="text-gray-300 mt-2">Anime: {animeId}</div>
            )}
        </aside>
    );
}

export default AnimeInfo;