import React from 'react';
import { Film, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { MovieItem } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  title: string;
  subtitle?: string;
  movies: MovieItem[];
  isLoading: boolean;
  onSelectMovie: (slug: string) => void;
  onBookmarkChanged?: () => void;
  onRetry?: () => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  title,
  subtitle,
  movies,
  isLoading,
  onSelectMovie,
  onBookmarkChanged,
  onRetry,
}) => {
  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-6 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-gradient-to-b from-purple-500 via-pink-500 to-rose-500 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1 ml-5">{subtitle}</p>}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 18 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden bg-[#121212] border border-white/5 animate-pulse flex flex-col"
            >
              <div className="aspect-[2/3] w-full bg-[#1c1c1c]" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-[#252525] rounded w-4/5" />
                <div className="h-3 bg-[#1e1e1e] rounded w-1/2" />
                <div className="h-3 bg-[#1e1e1e] rounded w-full pt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movie Grid */}
      {!isLoading && movies && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {movies.map((movie) => (
            <MovieCard
              key={movie.slug}
              movie={movie}
              onSelect={onSelectMovie}
              onBookmarkChanged={onBookmarkChanged}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!movies || movies.length === 0) && (
        <div className="w-full py-16 px-4 glass-panel rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-pink-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Không tìm thấy bộ phim nào</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Hiện tại danh mục hoặc từ khóa này chưa có phim tương ứng. Vui lòng thử lại với từ khóa khác hoặc chuyển danh mục.
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại dữ liệu
            </button>
          )}
        </div>
      )}
    </section>
  );
};

