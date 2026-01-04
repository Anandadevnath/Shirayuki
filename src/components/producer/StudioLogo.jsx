import React from "react";

/**
 * StudioLogo component for displaying a studio logo with fallback support.
 * @param {string} id - The studio/producer id (used for logo filename)
 * @param {string} name - The studio/producer name (for alt text)
 * @param {string} className - Additional classes for the image
 * @param {string} size - Optional size (e.g., 'w-12 h-12')
 */
export default function StudioLogo({ id, name, className = '', size = 'w-12 h-12 sm:w-16 sm:h-16' }) {
  return (
    <img
      key={id}
      src={`/studio-logo/${id}.webp`}
      alt={name + ' logo'}
      className={`object-contain ${size} bg-white/0 rounded transition-all duration-200 mx-auto ${className}`}
      style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
      onError={function handleImgError(e) {
        const fallbackOrder = [
          `/studio-logo/${id}.png`,
          `/studio-logo/${id}.jpg`,
          `/studio-logo/${id}.avif`
        ];
        const current = e.target.getAttribute('data-fallback') || 0;
        if (current < fallbackOrder.length) {
          e.target.src = fallbackOrder[current];
          e.target.setAttribute('data-fallback', Number(current) + 1);
        } else {
          e.target.style.display = 'none';
        }
      }}
      data-fallback="0"
    />
  );
}
