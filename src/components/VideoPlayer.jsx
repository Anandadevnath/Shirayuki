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
        <section className="col-span-6 bg-black/40 rounded-lg p-3 border border-white/20">
            <div>
                <div className="w-full h-[60vh] bg-black rounded overflow-hidden flex items-center justify-center relative">
                    {fetchingStream && <LoadingSpinner />}
                    {fetchError && (
                        <div className="text-red-400">{fetchError}</div>
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
                        <div className="text-gray-400">Select an episode to play</div>
                    )}
                </div>

                {/* Sub/Dub toggle + Reload button placed under the player */}
                <div className="w-full flex justify-end items-center gap-3 mt-3">
                    <div className="flex gap-2">
                        {/* Sub button always shown if sub episodes exist */}
                        <button
                            onClick={() => onSubDubToggle('sub')}
                            className={`px-3 py-1 rounded text-sm ${
                                !isDub 
                                    ? 'bg-pink-600 text-white' 
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            Sub
                        </button>

                        {/* Dub button only shown if current episode has dub available */}
                        {currentEpisodeHasDub && (
                            <button
                                onClick={() => onSubDubToggle('dub')}
                                className={`px-3 py-1 rounded text-sm ${
                                    isDub 
                                        ? 'bg-pink-600 text-white' 
                                        : 'bg-white/10 text-white hover:bg-white/20'
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
                        className={`bg-white/10 text-white px-3 py-1 rounded text-sm hover:bg-white/20 shadow-sm ${
                            reloading ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                    >
                        {reloading ? 'Reloading...' : 'Reload'}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default VideoPlayer;