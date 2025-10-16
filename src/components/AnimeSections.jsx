import React from "react";

function AnimeCard({ anime }) {
  return (
    <div
      className="relative rounded-lg shadow-lg mb-8 max-w-xl mx-auto overflow-hidden group"
      style={{ minHeight: 180, height: 210, maxWidth: '500px', width: '100%' }}
    >
      {/* Full image background */}
      <img
        src={anime.image}
        alt={anime.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:blur-sm"
        style={{ zIndex: 1, opacity: 0.5 }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{ zIndex: 2 }} />
      {/* Play button on hover */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 4 }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="backdrop-blur-md bg-white/30 border border-white/30 shadow-md rounded-full p-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="9,7 17,12 9,17" />
            </svg>
          </div>
        </div>
      </div>
      {/* Card content overlayed at the bottom */}
      <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col justify-end" style={{ zIndex: 3 }}>
        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg">{anime.title}</h3>
        <div className="flex items-center gap-3 text-white/90 mb-1 text-sm flex-wrap">
          <span>{anime.tv ? 'TV' : 'Movie'}</span>
          {anime.sub !== null && (
            <span className="bg-lime-700 text-lime-100 rounded px-2 py-0.5 text-xs font-semibold">SUB: {anime.sub}</span>
          )}
          {anime.dub !== null && (
            <span className="bg-sky-700 text-sky-100 rounded px-2 py-0.5 text-xs font-semibold">DUB: {anime.dub}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimeSections({ data }) {
  const sectionTitles = {
    top_airing: "Top Airing",
    most_popular: "Most Popular",
    most_favorite: "Most Favorite",
  };
  const sectionOrder = ["top_airing", "most_popular", "most_favorite"];
  // Group by section
  const grouped = sectionOrder.reduce((acc, section) => {
    acc[section] = data.filter((item) => item.section === section);
    return acc;
  }, {});
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-10 justify-center mt-8">
      {sectionOrder.map((section) => (
  <div key={section} className="w-full md:flex-1 md:min-w-[220px] md:max-w-[700px]">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
            <img
              src={
                section === 'most_popular'
                  ? 'https://i.imgur.com/vUPpEb4.gif'
                  : section === 'most_favorite'
                  ? 'https://media.tenor.com/LElrAxuxUBoAAAAM/one-piece.gif'
                  : 'https://image.myanimelist.net/ui/BQM6jEZ-UJLgGUuvrNkYUE7zFolqaImvCFFp13Snu8CbnSZHME8OKeWtqSXUw3CPTpdHkFXphA4-zdId5WzXxQ'
              }
              alt="section-icon"
              className="w-24 h-24 rounded-full object-cover opacity-90"
            />
            <h2 className="text-white font-bold text-3xl text-center md:text-left m-0">{sectionTitles[section]}</h2>
          </div>
          <div>
            {grouped[section].map((anime) => (
              <AnimeCard key={anime.title} anime={anime} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnimeSections;
