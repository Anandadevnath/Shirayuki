import React from 'react';
import LatestAnimeCard from './LatestAnimeCard.jsx';
import ScheduleSection from './ScheduleSection.jsx';
import Leaderboard from './Leaderboard.jsx';

const LatestAndLeaderboardSection = ({ recentSub, recentDub, handleAnimeClick }) => (
  (recentSub.length > 0 || recentDub.length > 0) && (
    <section className="mb-16">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-black/10 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentSub.map((anime, index) => (
                <LatestAnimeCard
                  key={`recent-sub-${anime.slug || anime.title || index}`}
                  anime={anime}
                  rank={index + 1}
                  onClick={() => handleAnimeClick(anime)}
                />
              ))}
              {recentDub.map((anime, index) => (
                <LatestAnimeCard
                  key={`recent-dub-${anime.slug || anime.title || index}`}
                  anime={anime}
                  rank={recentSub.length + index + 1}
                  onClick={() => handleAnimeClick(anime)}
                />
              ))}
            </div>
          </div>
          <ScheduleSection />
        </div>
        <div className="w-full md:w-[360px] md:min-w-[320px]">
          <Leaderboard />
        </div>
      </div>
    </section>
  )
);

export default LatestAndLeaderboardSection;
