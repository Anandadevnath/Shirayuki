import React from 'react';
import { BsFillChatLeftTextFill, BsFillVolumeUpFill } from 'react-icons/bs';
import { FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineHd } from 'react-icons/md';

const SliderHero = ({
  sliderData,
  currentSlide,
  slideAnimClass,
  dragging,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  getCurrentSpotlight,
  handleAnimeClick
}) => (
  sliderData.length > 0 && (
    <section
      className="slider-hero-container"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      style={{ userSelect: dragging ? 'none' : undefined }}
    >
      <div className={`slider-hero-anim-wrapper`} style={{ height: '100%' }}>
        {sliderData.map((s, idx) => (
          <img
            key={`bg-${idx}`}
            className={`slider-hero-bg-layer ${idx === currentSlide ? 'active' : ''}`}
            src={s.image || '/placeholder-hero.jpg'}
            alt={s.title || `slide-${idx}`}
          />
        ))}
        <div className="slider-hero-overlay" />
        <div
          className={`slider-hero-content ${slideAnimClass} ${slideAnimClass ? 'animate' : ''}`}
          style={{ marginLeft: 'calc(4rem + 1.5rem)' }}
        >
          <div className="slider-hero-badge">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <rect width="24" height="24" rx="12" fill="#fff2" />
              <path d="M7 10v4a2 2 0 002 2h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 14V8a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h6z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>#{currentSlide + 1} Spotlight</span>
          </div>
          <div className="slider-hero-title">
            {getCurrentSpotlight()?.title || 'Anime Title'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {getCurrentSpotlight()?.sub && (
              <span className="slider-hero-badge">
                <BsFillChatLeftTextFill /> SUB
              </span>
            )}
            {getCurrentSpotlight()?.dub && (
              <span className="slider-hero-badge">
                <BsFillVolumeUpFill /> DUB
              </span>
            )}
            {getCurrentSpotlight()?.duration && (
              <span className="slider-hero-badge">
                <FiClock /> {getCurrentSpotlight().duration}
              </span>
            )}
            {getCurrentSpotlight()?.quality && (
              <span className="slider-hero-badge">
                <MdOutlineHd /> {getCurrentSpotlight().quality}
              </span>
            )}
            {getCurrentSpotlight()?.releaseDate && (
              <span className="slider-hero-badge">
                <FiCalendar /> {getCurrentSpotlight().releaseDate}
              </span>
            )}
          </div>
          <div className="slider-hero-desc">
            {(() => {
              const desc = getCurrentSpotlight()?.description || '';
              if (desc.length < 10) return desc;
              const half = Math.ceil(desc.length / 2);
              return desc.slice(0, half) + (desc.length > half ? '...' : '');
            })()}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="slider-hero-btn"
              onClick={() => handleAnimeClick(getCurrentSpotlight())}
            >
              Watch Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
);

export default SliderHero;
