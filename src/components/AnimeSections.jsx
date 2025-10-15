import React from "react";

const sectionTitles = {
  top_airing: "Top Airing",
  most_popular: "Most Popular",
  most_favorite: "Most Favorite",
};

const sectionOrder = ["top_airing", "most_popular", "most_favorite"];

function AnimeCard({ anime }) {
  return (
    <div className="anime-card" style={{ display: "flex", marginBottom: 24 }}>
      <img
        src={anime.image}
        alt={anime.title}
        style={{
          width: 64,
          height: 85,
          borderRadius: 8,
          objectFit: "cover",
          marginRight: 16,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{anime.title}</div>
        <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
          {anime.sub !== null && (
            <span style={{ background: "#1e293b", color: "#a3e635", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}>
              cc {anime.sub}
            </span>
          )}
          {anime.dub !== null && (
            <span style={{ background: "#1e293b", color: "#38bdf8", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}>
              <span role="img" aria-label="mic">🎤</span> {anime.dub}
            </span>
          )}
          <span style={{ color: "#cbd5e1", fontSize: 12 }}>{anime.tv ? "TV" : "Movie"}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnimeSections({ data }) {
  // Group by section
  const grouped = sectionOrder.reduce((acc, section) => {
    acc[section] = data.filter((item) => item.section === section);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 32 }}>
      {sectionOrder.map((section) => (
        <div key={section} style={{ flex: 1, minWidth: 300 }}>
          <h2 style={{ color: "#f9a8d4", fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
            {sectionTitles[section]}
          </h2>
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
