import { Maximize, Captions, RotateCcw, RotateCw, Volume2, VolumeX, Pause, Play } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export default function VideoPlayerControls({
    isPlaying,
    togglePlay,
    skip,
    isMuted,
    toggleMute,
    volume,
    handleVolumeChange,
    currentTime,
    duration,
    formatTime,
    playbackRate,
    changePlaybackRate,
    playbackRates,
    selectedCaption,
    handleCaptionSelect,
    subtitleTracks,
    toggleFullscreen,
}) {

    const englishTrack = subtitleTracks.find(track => (track.label || '').toLowerCase().includes('english')) || subtitleTracks[0];
    const captionsOn = selectedCaption === (englishTrack ? englishTrack.label : null);

    const handleCaptionToggle = () => {
        if (!englishTrack) return;
        if (captionsOn) {
            handleCaptionSelect(null);
        } else {
            handleCaptionSelect(englishTrack.label);
        }
    };

    const [showVolume, setShowVolume] = useState(false);
    const volumeGroupRef = useRef(null);
    const hideTimerRef = useRef(null);
    const isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0) || (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches));


    const handleVolumeButtonClick = () => {
        if (isTouchDevice) {
            setShowVolume(prev => !prev);
            return;
        }
        toggleMute();
    };

    useEffect(() => {
        if (!showVolume) return;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowVolume(false), 3500);

        const onDocClick = (ev) => {
            if (volumeGroupRef.current && !volumeGroupRef.current.contains(ev.target)) {
                setShowVolume(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('touchstart', onDocClick);
        return () => {
            clearTimeout(hideTimerRef.current);
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('touchstart', onDocClick);
        };
    }, [showVolume]);

    const handlePlaybackRateClick = () => {
        if (!playbackRates || playbackRates.length === 0) return;
        const currentIdx = playbackRates.indexOf(playbackRate);
        const nextIdx = (currentIdx + 1) % playbackRates.length;
        changePlaybackRate(playbackRates[nextIdx]);
    };

    return (
        <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 pb-3 w-full overflow-x-auto overflow-visible scrollbar-none" style={{ flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', minHeight: 48 }}>
            {/* Left Side */}
            <div className="flex items-center gap-1">
                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="p-2 sm:p-3 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 group/btn backdrop-blur-sm"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
                    ) : (
                        <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover/btn:text-cyan-300 transition-colors" fill="white" />
                    )}
                </button>
                {/* Skip Backward */}
                <button
                    onClick={() => skip(-10)}
                    className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
                    title="Rewind 10s"
                >
                    <RotateCcw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
                </button>
                {/* Skip Forward */}
                <button
                    onClick={() => skip(10)}
                    className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all hover:scale-110 backdrop-blur-sm"
                    title="Forward 10s"
                >
                    <RotateCw className="h-5 w-5 text-white hover:text-cyan-300 transition-colors" />
                </button>
                {/* Volume */}
                <div ref={volumeGroupRef} className="flex items-center gap-1 ml-1 group/volume">
                    <button
                        onClick={handleVolumeButtonClick}
                        className="p-2 hover:bg-cyan-500/30 rounded-xl transition-all backdrop-blur-sm relative z-10 bg-white/3"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted || volume === 0 ? (
                            <VolumeX className="h-5 w-5 text-white transition-colors" />
                        ) : (
                            <Volume2 className="h-5 w-5 text-white transition-colors" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => {
                            handleVolumeChange(e);
                            if (isTouchDevice) {
                                setShowVolume(true);
                                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                                hideTimerRef.current = setTimeout(() => setShowVolume(false), 3500);
                            }
                        }}
                        className={`
                            ${showVolume ? 'w-28 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'}
                            group-hover/volume:w-28 group-hover/volume:opacity-100 group-hover/volume:pointer-events-auto
                            transition-all duration-300 ease-out h-2 bg-gradient-to-r from-cyan-700/40 to-cyan-700/40 rounded-full appearance-none cursor-pointer ml-3 z-0
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_8px_18px_rgba(2,6,23,0.6)]
                        `}
                    />
                </div>
                {/* Time Display */}
                <div className="hidden md:flex items-center text-sm font-mono text-white ml-3 bg-white/12 px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-cyan-300 font-bold">{formatTime(currentTime)}</span>
                    <span className="mx-2 text-white/60">/</span>
                    <span className="text-white">{formatTime(duration)}</span>
                </div>
            </div>
            {/* Right Side */}
            <div className="flex items-center gap-1">
                {/* Playback Speed */}
                <div className="relative">
                    <button
                        onClick={handlePlaybackRateClick}
                        className={`px-4 py-2 rounded-xl transition-all backdrop-blur-sm font-mono font-bold text-sm hover:bg-cyan-500/30 text-white hover:text-cyan-200`}
                        title="Change playback speed"
                    >
                        {playbackRate}x
                    </button>
                </div>

                {/* Captions Toggle */}
                <button
                    onClick={handleCaptionToggle}
                    className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${captionsOn ? 'bg-gradient-to-r from-cyan-500/35 to-purple-500/35 text-cyan-200' : 'hover:bg-cyan-500/30 text-white hover:text-cyan-200'}`}
                    title={captionsOn ? 'Turn off captions' : 'Turn on English captions'}
                    disabled={!englishTrack}
                >
                    <Captions className="h-5 w-5" />
                </button>
                {/* Fullscreen */}
                <button
                    onClick={toggleFullscreen}
                    className="p-2.5 hover:bg-cyan-500/30 rounded-xl transition-all hover:scale-110 backdrop-blur-sm ml-1 bg-white/2"
                    title="Fullscreen"
                >
                    <Maximize className="h-5 w-5 text-white transition-colors" />
                </button>
            </div>
        </div>
    );
}
