import React, { useEffect, useState } from 'react';
import '../styles/Leaderboard.css';
import { getTop10, getWeekly10, getMonthly10 } from '../context/apiService';

const leaderboardTabs = [
  { label: 'Today', api: getTop10 },
  { label: 'Week', api: getWeekly10 },
  { label: 'Month', api: getMonthly10 },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    leaderboardTabs[activeTab].api().then((data) => {
      console.log('Leaderboard API response:', data);

      let animeList = [];
      if (Array.isArray(data)) {
        animeList = data;
      } else if (Array.isArray(data?.data)) {
        animeList = data.data;
      } else if (Array.isArray(data?.results)) {
        animeList = data.results;
      } else if (data?.data && typeof data.data === 'object') {
        // If data.data is an object with numeric keys, convert to array
        animeList = Object.keys(data.data)
          .filter((k) => !isNaN(Number(k)))
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => data.data[k]);
      }
      setAnimes(animeList);
      setLoading(false);
    });
  }, [activeTab]);

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title" style={{display:'flex',alignItems:'center',gap:'10px'}}>
        {/* Leaderboard Icon SVG */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="14" width="6" height="10" rx="2" fill="#FFD700"/>
          <rect x="11" y="6" width="6" height="18" rx="2" fill="#C0C0C0"/>
          <rect x="20" y="10" width="6" height="14" rx="2" fill="#CD7F32"/>
        </svg>
        Leaderboard
      </h2>
      <div className="leaderboard-tabs">
        {leaderboardTabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`leaderboard-tab${activeTab === idx ? ' active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="leaderboard-list">
        {loading ? (
          <div className="leaderboard-loading">Loading...</div>
        ) : (
          animes && animes.length > 0 ? (
            animes.map((anime, i) => (
              <div className="leaderboard-item leaderboard-bgfill group" key={anime.id || i}>
                <div
                  className="leaderboard-bgfill-img"
                  style={{
                    backgroundImage: (() => {
                      const imgSrc = anime.image || anime.cover || anime.poster || anime.thumbnail || anime.img || '/placeholder-anime.jpg';
                      const safeImgSrc = typeof imgSrc === 'string' ? imgSrc.replace(/'/g, '%27') : '/placeholder-anime.jpg';
                      return `url(${safeImgSrc})`;
                    })()
                  }}
                >
                  <div className="leaderboard-bgfill-overlay group-hover:backdrop-blur-md transition-all duration-300" />
                  <div className="leaderboard-bgfill-content">
                    <span className="leaderboard-bgfill-rank">{String(i + 1).padStart(2, '0')}</span>
                    <span className="leaderboard-bgfill-title">{anime.title}</span>
                  </div>
                  <div className="leaderboard-play-icon">
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,0.18)" style={{backdropFilter:'blur(8px)'}} />
                      <circle cx="19" cy="19" r="18" fill="url(#glassGradient)" fillOpacity="0.5" />
                      <polygon points="15,12 28,19 15,26" fill="#fff" fillOpacity="0.85" />
                      <defs>
                        <linearGradient id="glassGradient" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#fff" stopOpacity="0.4" />
                          <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="leaderboard-empty">No data available.</div>
          )
        )}
      </div>
    </div>
  );
}
