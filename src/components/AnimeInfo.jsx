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
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <LoadingSpinner />
                    <p className="text-gray-400 text-sm">Loading anime details...</p>
                </div>
            )}

            {detailsError && (
                <div className="text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="font-medium">Error loading details</div>
                    <div className="text-sm mt-1">{detailsError}</div>
                </div>
            )}

            {!detailsLoading && !detailsError && detailsData && (
                <div className="space-y-4">
                    {detailsData.image && (
                        <div className="relative">
                            <img 
                                src={detailsData.image} 
                                alt={detailsData.title || animeId} 
                                className="w-full rounded-lg object-cover aspect-[3/4] shadow-lg" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg"></div>
                        </div>
                    )}
                    <div>
                        <h2 className="text-white font-semibold text-lg leading-tight">
                            {detailsData.title || animeId}
                        </h2>
                    </div>

                    {/* Compact info row */}
                    <div className="bg-black/30 rounded-lg p-3 space-y-2">
                    <div className="text-gray-400 text-sm grid grid-cols-1 gap-2">
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
                    </div>

                    {detailsData.synopsis ? (
                        <div className="bg-black/30 rounded-lg p-3">
                            <h4 className="text-gray-200 font-medium mb-2">Synopsis</h4>
                            <div className="text-gray-400 text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                                {detailsData.synopsis.length > 300 
                                    ? `${detailsData.synopsis.slice(0, 300)}...` 
                                    : detailsData.synopsis
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="bg-black/30 rounded-lg p-3">
                            <div className="text-gray-400 text-sm text-center">
                                No synopsis available.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!detailsLoading && !detailsError && !detailsData && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-4xl text-gray-600 mb-3">📖</div>
                    <div className="text-gray-300">Anime: {animeId}</div>
                    <div className="text-gray-500 text-sm mt-1">No additional details available</div>
                </div>
            )}
        </aside>
    );
}

export default AnimeInfo;