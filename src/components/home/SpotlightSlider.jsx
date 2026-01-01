import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const SPOTLIGHT_INTERVAL = 5000;

export const SpotlightSlider = memo(function SpotlightSlider({ spotlightAnimes }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);
  const length = spotlightAnimes.length;

  const goToSlide = useCallback((index) => {
    if (nextIndex !== null || index === currentIndex) return;
    setNextIndex(index);
    setTimeout(() => {
      setCurrentIndex(index);
      setNextIndex(null);
    }, 700);
  }, [nextIndex, currentIndex]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % length);
  }, [currentIndex, length, goToSlide]);

  const goToPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + length) % length);
  }, [currentIndex, length, goToSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) goToNext();
    }, SPOTLIGHT_INTERVAL);
    return () => clearInterval(interval);
  }, [isDragging, goToNext]);

  // Mouse/Touch drag handlers
  const handleDragStart = useCallback((clientX) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragDelta.current = 0;
  }, []);

  const handleDragMove = useCallback((clientX) => {
    if (!isDragging) return;
    dragDelta.current = clientX - dragStartX.current;
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 80;
    if (dragDelta.current > threshold) {
      goToPrev();
    } else if (dragDelta.current < -threshold) {
      goToNext();
    }
    dragDelta.current = 0;
  }, [isDragging, goToNext, goToPrev]);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const currentAnime = spotlightAnimes[currentIndex];
  const nextAnime = nextIndex !== null ? spotlightAnimes[nextIndex] : null;

  // Render a slide
  const renderSlide = (anime) => (
    <>
      <img
        src={anime.poster}
        alt={anime.name}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex flex-col justify-center pb-24 max-w-[1480px] mx-auto px-8 lg:px-12 pointer-events-none">
        <h1 className="text-5xl font-bold text-white mb-4 max-w-2xl">{anime.name}</h1>
        <div className="flex gap-3 mb-4">
          {anime.episodes?.sub && (
            <Badge className="bg-zinc-800/80 text-white border border-zinc-600 px-3 py-1">
              <span className="mr-1">📺</span> {anime.episodes.sub}
            </Badge>
          )}
          {anime.episodes?.dub && (
            <Badge className="bg-zinc-800/80 text-white border border-zinc-600 px-3 py-1">
              <span className="mr-1">🎙️</span> {anime.episodes.dub}
            </Badge>
          )}
        </div>
        <p className="text-zinc-300 max-w-2xl line-clamp-4 text-base leading-relaxed mb-6">{anime.description}</p>
        <Link 
          to={`/anime/${anime.id}`}
          className="w-fit px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors pointer-events-auto"
        >
          Learn More
        </Link>
      </div>
    </>
  );

  return (
    <section 
      className="relative w-full h-[730px] -mt-20 overflow-hidden cursor-grab active:cursor-grabbing group select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Slide */}
      <div className="absolute inset-0 z-0">
        {renderSlide(currentAnime)}
      </div>
      
      {/* Next Slide (fades in on top) */}
      {nextAnime && (
        <div 
          className="absolute inset-0 z-10"
          style={{ animation: 'spotlightFadeIn 700ms ease-in-out forwards' }}
        >
          {renderSlide(nextAnime)}
        </div>
      )}
      
      <style>{`
        @keyframes spotlightFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
});
