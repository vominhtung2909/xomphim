import React, { useState } from 'react';
import { Play, Bookmark, Clock } from 'lucide-react';
import { MovieItem } from '../types/movie';
import { isBookmarked, toggleBookmark } from '../services/storage';

interface MovieCardProps {
  movie: MovieItem;
  onSelect: (slug: string) => void;
  onBookmarkChanged?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
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
      id={`movie-card-${movie.slug}`}
      onClick={() => onSelect(movie.slug)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#111111] border border-white/10 hover:border-purple-500 shadow-md hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.04] cursor-pointer"
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
          <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
            {movie.current_episode || 'Full'}
          </span>

          <div className="flex items-center gap-1">
            {movie.quality && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-purple-300 border border-purple-500/40 backdrop-blur-sm">
                {movie.quality}
              </span>
            )}
            {movie.language && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/80 text-slate-300 border border-white/10 backdrop-blur-sm truncate max-w-[80px]">
                {movie.language}
              </span>
            )}
          </div>
        </div>

        {/* Floating Quick Bookmark Button */}
        <button
          onClick={handleBookmark}
          title={isSaved ? 'Xóa khỏi Yêu thích' : 'Lưu phim'}
          className={`absolute bottom-2 right-2 z-20 p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            isSaved
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/50'
              : 'bg-black/70 text-slate-300 hover:text-white hover:bg-purple-600 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Hover Gradient Overlay with Glowing Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
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
            {movie.original_name || 'Xóm Phim Vietsub'}
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

