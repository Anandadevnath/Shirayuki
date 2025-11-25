import React from 'react';
import { LoadingSpinner } from './LoadingStates';

function VideoPlayer({ 
    animeId, 
    selectedEp, 
    iframeSrc, 
    fetchingStream, 
    fetchError, 
    iframeKey, 
    videoRef,
    isDub,
    currentEpisodeHasDub,
    reloading,
    onSubDubToggle,
    onReload
}) {
    return (
        <section className="col-span-6 bg-black/40 rounded-lg p-4 border border-white/20">
            <div className="space-y-4">
                <div className="w-full h-[60vh] bg-black rounded overflow-hidden flex items-center justify-center relative">
                    {fetchingStream && (
                        <div className="flex flex-col items-center gap-3">
                            <LoadingSpinner />
                            <p className="text-gray-400 text-sm">Loading episode {selectedEp}...</p>
                        </div>
                    )}
                    {fetchError && (
                        <div className="flex flex-col items-center gap-3 text-center px-4">
                            <div className="text-red-400 text-lg">⚠️ Failed to load episode</div>
                            <div className="text-gray-400 text-sm">{fetchError}</div>
                            <button
                                onClick={onReload}
                                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                    {!fetchingStream && !fetchError && iframeSrc && (
                        <>
                            {iframeSrc.endsWith('.m3u8') ? (
                                <video
                                    ref={videoRef}
                                    className="w-full h-full rounded bg-black"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <iframe
                                    key={`iframe-${iframeKey}-${iframeSrc}`}
                                    title={`${animeId}-ep-${selectedEp}`}
                                    src={iframeSrc}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                    referrerPolicy="no-referrer"
                                    loading="eager"
                                />
                            )}
                            <div className="absolute top-3 right-3 flex gap-2">
                                <a
                                    href={iframeSrc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/10 text-white px-3 py-1 rounded text-sm hover:bg-white/20"
                                    title="Open stream in new tab"
                                >
                                    Open in tab
                                </a>
                            </div>
                        </>
                    )}
                    {!iframeSrc && !fetchingStream && !fetchError && (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="text-4xl text-gray-600">📺</div>
                            <div className="text-gray-400">Select an episode to start watching</div>
                        </div>
                    )}
                </div>

                {/* Episode info and controls */}
                <div className="flex justify-between items-center">
                    <div className="text-gray-300">
                        <span className="font-medium">Episode {selectedEp}</span>
                        {animeId && (
                            <span className="text-gray-500 ml-2">• {animeId}</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {/* Sub button always shown if sub episodes exist */}
                            <button
                                onClick={() => onSubDubToggle('sub')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    !isDub 
                                        ? 'bg-pink-600 text-white shadow-lg' 
                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                }`}
                            >
                                Sub
                            </button>

                            {/* Dub button only shown if current episode has dub available */}
                            {currentEpisodeHasDub && (
                                <button
                                    onClick={() => onSubDubToggle('dub')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isDub 
                                            ? 'bg-pink-600 text-white shadow-lg' 
                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                    }`}
                                >
                                    Dub
                                </button>
                            )}
                        </div>

                        <button
                            onClick={onReload}
                            title="Reload stream"
                            disabled={reloading}
                            className={`bg-white/10 text-white px-4 py-2 rounded-md text-sm hover:bg-white/20 transition-colors border border-white/20 ${
                                reloading ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                        >
                            {reloading ? 'Reloading...' : 'Reload'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default VideoPlayer;