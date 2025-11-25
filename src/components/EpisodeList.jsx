import React from 'react';
import { useNavigate } from 'react-router-dom';

function EpisodeList({ episodes, selectedEp, onEpisodeSelect }) {
    const navigate = useNavigate();

    return (
        <aside className="col-span-3 bg-black/60 rounded-lg p-4 h-[81vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Episodes</h3>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors border border-white/20"
                >
                    ← Back
                </button>
            </div>
            <div>
                {episodes.length === 0 && (
                    <div className="text-gray-400">No episodes available</div>
                )}
                {episodes.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {episodes.map((num) => (
                            <button
                                key={num}
                                title={`Episode ${num}`}
                                onClick={() => onEpisodeSelect(num)}
                                className={`h-10 flex items-center justify-center rounded-md text-sm font-medium border transition-all duration-200 ${
                                    selectedEp === num 
                                        ? 'bg-pink-600 text-white border-pink-500 shadow-lg scale-105' 
                                        : 'bg-black/30 text-gray-200 border-white/10 hover:bg-black/20 hover:border-white/30'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default EpisodeList;