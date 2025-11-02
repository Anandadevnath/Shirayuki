import React from 'react';

const AnimeStatsSection = ({ mostPopular, topAiring, mostFavorite }) => (
  <section className="-mt-8 mb-12">
    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
      {/* Most Popular */}
      <div style={{ flex: 1 }}>
        <h3 className="text-xl font-bold mb-4">Most Popular</h3>
        {mostPopular.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mostPopular.map(anime => (
              <div key={anime.id || anime.slug || anime.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                <img src={anime.image || anime.poster || '/placeholder-anime.jpg'} alt={anime.title} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px #0002' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{anime.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {anime.type || 'TV'}{anime.episodes ? ` • ${anime.episodes} eps` : ''}
                    {typeof anime.sub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#aef', fontWeight: 500 }}>SUB: {anime.sub}</span>
                    )}
                    {typeof anime.dub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#fea', fontWeight: 500 }}>DUB: {anime.dub}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No items available</div>
        )}
      </div>
      {/* Top Airing */}
      <div style={{ flex: 1 }}>
        <h3 className="text-xl font-bold mb-4">Top Airing</h3>
        {topAiring.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topAiring.map(anime => (
              <div key={anime.id || anime.slug || anime.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                <img src={anime.image || anime.poster || '/placeholder-anime.jpg'} alt={anime.title} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px #0002' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{anime.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {anime.type || 'TV'}{anime.episodes ? ` • ${anime.episodes} eps` : ''}
                    {typeof anime.sub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#aef', fontWeight: 500 }}>SUB: {anime.sub}</span>
                    )}
                    {typeof anime.dub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#fea', fontWeight: 500 }}>DUB: {anime.dub}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No items available</div>
        )}
      </div>
      {/* Most Favorite */}
      <div style={{ flex: 1 }}>
        <h3 className="text-xl font-bold mb-4">Most Favorite</h3>
        {mostFavorite.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mostFavorite.map(anime => (
              <div key={anime.id || anime.slug || anime.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                <img src={anime.image || anime.poster || '/placeholder-anime.jpg'} alt={anime.title} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px #0002' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{anime.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {anime.type || 'TV'}{anime.episodes ? ` • ${anime.episodes} eps` : ''}
                    {typeof anime.sub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#aef', fontWeight: 500 }}>SUB: {anime.sub}</span>
                    )}
                    {typeof anime.dub !== 'undefined' && (
                      <span style={{ marginLeft: '0.5rem', color: '#fea', fontWeight: 500 }}>DUB: {anime.dub}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No items available</div>
        )}
      </div>
    </div>
  </section>
);

export default AnimeStatsSection;
