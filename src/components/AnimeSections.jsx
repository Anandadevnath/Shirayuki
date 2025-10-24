function SmallListItem({ anime }) {

  const subCount = anime.sub ?? anime.sub_count ?? anime.subs ?? null;
  const dubCount = anime.dub ?? anime.dub_count ?? anime.dubs ?? null;
  const cc = anime.cc ?? anime.count ?? anime.views ?? null;
  const mic = anime.mic ?? anime.voice ?? anime.comments ?? null;
  const badgeA = subCount != null ? subCount : (cc != null ? cc : 0);
  const badgeB = dubCount != null ? dubCount : (mic != null ? mic : 0);

  return (
    <div className="flex items-center gap-4 py-3">
      <img
        src={anime.image || '/placeholder-anime.jpg'}
        alt={anime.title}
        className="anime-card-img"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold text-md line-clamp-2">{anime.title}</div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="bg-black/50 text-white text-xs px-2 py-0.5 border border-white/14 rounded-md">SUB: {badgeA}</span>
          <span className="bg-black/50 text-white text-xs px-2 py-0.5 border border-white/14 rounded-md">DUB: {badgeB}</span>
          <div className="text-gray-300 text-sm">{anime.tv ? 'TV' : ''}</div>
        </div>
      </div>
    </div>
  );
}

function SectionColumn({ title, items = [] }) {
  return (
    <div className="w-full md:flex-1">
      <div className="bg-black/10 backdrop-blur rounded-xl border border-white/6 p-4">
        <div className="flex flex-col">
          {items.length === 0 && (
            <div className="text-gray-400 text-sm py-6">No items available</div>
          )}
          {items.map((anime, idx) => (
            <div key={anime.title + '-' + idx}>
              <SmallListItem anime={anime} />
              {idx !== items.length - 1 && <div className="border-t border-white/6 my-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimeSections({ data }) {
  const sectionTitles = {
    top_airing: 'Top Airing',
    most_popular: 'Most Popular',
    most_favorite: 'Most Favorite',
  };
  const sectionOrder = ['top_airing', 'most_popular', 'most_favorite'];

  const grouped = sectionOrder.reduce((acc, section) => {
    acc[section] = data.filter((item) => item.section === section).slice(0, 6);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-12 mb-8">
      {sectionOrder.map((section) => (
        <SectionColumn key={section} title={sectionTitles[section]} items={grouped[section] || []} />
      ))}
    </div>
  );
}

export default AnimeSections;
