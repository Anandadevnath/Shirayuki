import React from 'react';
import { useNavigate } from 'react-router-dom';

function EpisodeList({ episodes, selectedEp, onEpisodeSelect }) {
    const navigate = useNavigate();

    return (
        <aside className="col-span-3 bg-black/60 rounded-lg p-4 max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="mt-3 flex items-center gap-3">
                <div className="mb-4 font-semibold">List of episodes:</div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-3 py-0 bg-white/10 rounded"
                >
                    Back
                </button>
            </div>
            <div>
                {episodes.length === 0 && (
                    <div className="text-gray-400">No episodes available</div>
                )}
                {episodes.length > 0 && (
                    <div className="grid grid-cols-5 gap-3">
                        {episodes.map((num) => (
                            <button
                                key={num}
                                title={`Episode ${num}`}
                                onClick={() => onEpisodeSelect(num)}
                                className={`w-full h-10 flex items-center justify-center rounded-md text-sm font-medium border ${
                                    selectedEp === num 
                                        ? 'bg-pink-600 text-white border-white' 
                                        : 'bg-black/30 text-gray-200 border-white/10 hover:bg-black/20'
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