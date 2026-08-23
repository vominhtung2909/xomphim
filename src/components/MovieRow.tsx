import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Bookmark, Clock, Sparkles } from 'lucide-react';
import { MovieItem } from '../types/movie';
import { isBookmarked, toggleBookmark } from '../services/storage';
import { getMoviesForRow } from '../services/api';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  categorySlug?: string;
  categoryType?: 'type' | 'genre' | 'country';
  movies?: MovieItem[];
  isLoading?: boolean;
  onSelectMovie: (slug: string) => void;
  onViewAll?: () => void;
  onBookmarkChanged?: () => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  subtitle,
  icon,
  categorySlug,
  categoryType = 'type',
  movies,
  isLoading: externalLoading = false,
  onSelectMovie,
  onViewAll,
  onBookmarkChanged,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [internalMovies, setInternalMovies] = useState<MovieItem[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  // Fetch exactly 30 movies automatically using Promise.all() across 3 pages
  useEffect(() => {
    if ((!movies || movies.length === 0) && categorySlug) {
      let isMounted = true;
      setInternalLoading(true);

      const fetchData = async () => {
        try {
          const type = (categoryType || 'type') as 'type' | 'genre' | 'country';
          const items = await getMoviesForRow(categorySlug, type, 30);
          if (isMounted) {
            setInternalMovies(items);
          }
        } catch (err) {
          console.error(`Failed to load 30 movies for row ${categorySlug}:`, err);
        } finally {
          if (isMounted) {
            setInternalLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        isMounted = false;
      };
    }
  }, [categorySlug, categoryType, movies]);

  const displayMovies = (movies && movies.length > 0 ? movies.slice(0, 30) : internalMovies) || [];
  const isLoading = externalLoading || (internalLoading && displayMovies.length === 0);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 15);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15);
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 300);
    const timer2 = setTimeout(checkScroll, 800);

    const el = rowRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [displayMovies]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const slider = rowRef.current;
    const scrollDistance = slider.clientWidth;
    slider.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  return (
    <section className="category-section relative w-full py-2 sm:py-3.5 group/section">
      {/* Row Header */}
      <div className="flex items-center justify-between px-[15px] md:px-[40px] mb-3 sm:mb-4">
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="group/title flex items-center gap-2.5 text-left cursor-pointer transition-all hover:opacity-95"
            title={`Xem danh sách phân loại: ${title}`}
          >
            {icon && (
              <div className="text-purple-400 group-hover/title:scale-110 transition-transform shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white group-hover/title:text-purple-400 tracking-wide font-heading transition-colors flex items-center gap-1.5">
                <span>{title}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 opacity-60 group-hover/title:opacity-100 group-hover/title:translate-x-1 transition-all shrink-0" />
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 group-hover/title:text-slate-300 transition-colors">
                  {subtitle}
                </p>
              )}
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-purple-400 shrink-0">{icon}</div>}
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wide font-heading">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        )}

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs sm:text-sm font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-3"
            title={`Xem danh sách phân loại: ${title}`}
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row Container with Netflix Glassmorphism Edge Navigation Buttons */}
      <div className="relative w-full px-[15px] md:px-[40px]">
        {/* Left Scroll Button - Glowing Floating Netflix Button */}
        <button
          onClick={() => handleScroll('left')}
          className={`slider-nav-btn left ${
            showLeftArrow
              ? 'opacity-95 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
        </button>

        {/* Right Scroll Button - Glowing Floating Netflix Button */}
        <button
          onClick={() => handleScroll('right')}
          className={`slider-nav-btn right ${
            showRightArrow
              ? 'opacity-95 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
        </button>

        {/* Cards Row - Exactly 5 cards fitted on Desktop, Netflix style horizontal smooth scroll */}
        <div
          ref={rowRef}
          className="movie-slider flex items-stretch gap-4 overflow-x-auto scroll-smooth no-scrollbar horizontal-slider py-3"
          style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="movie-slider-card flex-shrink-0 aspect-[2/3] rounded-xl bg-slate-900/80 animate-pulse border border-slate-800"
                />
              ))
            : displayMovies.map((movie) => (
                <MovieRowCard
                  key={movie.slug}
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  onBookmarkChanged={onBookmarkChanged}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

interface MovieRowCardProps {
  movie: MovieItem;
  onSelectMovie: (slug: string) => void;
  onBookmarkChanged?: () => void;
}

const MovieRowCard: React.FC<MovieRowCardProps> = ({
  movie,
  onSelectMovie,
  onBookmarkChanged,
}) => {
  const [isSaved, setIsSaved] = useState(() => isBookmarked(movie.slug));
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = toggleBookmark(movie);
    setIsSaved(state);
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const posterSrc = movie.thumb_url || movie.poster_url;

  return (
    <div
      onClick={() => onSelectMovie(movie.slug)}
      className="movie-slider-card flex-shrink-0 group relative flex flex-col rounded-xl overflow-hidden bg-[#111111] border border-white/10 hover:border-purple-500 transition-all duration-300 transform hover:scale-[1.05] hover:z-20 shadow-lg hover:shadow-purple-500/25 cursor-pointer select-none"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Poster Image Container */}
      <div className="poster-container relative aspect-[2/3] w-full overflow-hidden bg-[#0d0d0d] rounded-t-xl">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-[#181818] animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-mono">Đang tải...</span>
          </div>
        )}

        <img
          src={posterSrc}
          alt={movie.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover object-center rounded-t-xl transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/300x450/181818/ffffff?text=Xóm+Phim';
            setImgLoaded(true);
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/40">
            {movie.current_episode || 'Full'}
          </span>

          {movie.quality && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-purple-300 border border-purple-400/40 backdrop-blur-sm">
              {movie.quality}
            </span>
          )}
        </div>

        {/* Floating Bookmark Button */}
        <button
          onClick={handleBookmark}
          title={isSaved ? 'Xóa khỏi Yêu thích' : 'Lưu phim'}
          className={`absolute bottom-2 right-2 z-20 p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            isSaved
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/50 opacity-100'
              : 'bg-black/70 text-slate-300 hover:text-white hover:bg-purple-600 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Hover Gradient Overlay with Glowing Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-[#111111]">
        <div>
          <h3
            title={movie.name}
            className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1"
          >
            {movie.name}
          </h3>
          <p
            title={movie.original_name}
            className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5"
          >
            {movie.original_name || 'Xóm Phim HD'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-white/5 text-[10px] sm:text-[11px] text-slate-400 min-w-0">
          <span className="flex items-center gap-1 min-w-0 truncate text-slate-400">
            {movie.time ? (
              <>
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                <span className="truncate">{movie.time}</span>
              </>
            ) : (
              <span className="text-slate-500 truncate">HD Online</span>
            )}
          </span>
          <span className="text-purple-400 font-bold flex items-center gap-0.5 sm:gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 whitespace-nowrap text-[10px] sm:text-[11px]">
            Xem ngay <Play className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-purple-400 shrink-0" />
          </span>
        </div>
      </div>
    </div>
  );
};
