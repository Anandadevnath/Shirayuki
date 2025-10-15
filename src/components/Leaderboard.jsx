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
      <h2 className="leaderboard-title">Top 10</h2>
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
              <div className="leaderboard-item" key={anime.id || i}>
                <span className="leaderboard-rank">{String(i + 1).padStart(2, '0')}</span>
                <img
                  className="leaderboard-thumb"
                  src={
                    anime.image ||
                    anime.cover ||
                    anime.poster ||
                    anime.thumbnail ||
                    anime.img ||
                    '/placeholder-anime.jpg'
                  }
                  alt={anime.title}
                />
                <div className="leaderboard-info">
                  <div className="leaderboard-title-main">{anime.title}</div>
                  <div className="leaderboard-meta">
                    {anime.subCount !== undefined && (
                      <span className="leaderboard-meta-badge sub">SUB: {anime.subCount}</span>
                    )}
                    {anime.dubCount !== undefined && (
                      <span className="leaderboard-meta-badge dub">DUB: {anime.dubCount}</span>
                    )}
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
