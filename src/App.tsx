import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  Sparkles,
  Flame,
  Tv,
  Clapperboard,
  Compass,
  Globe,
  ArrowUp,
  Code2,
  RefreshCw,
  Search,
  Bookmark,
  History,
  Play
} from 'lucide-react';
import {
  CategoryOption,
  MovieDetail,
  MovieItem,
  PaginateInfo,
  ViewMode
} from './types/movie';
import {
  GENRES,
  COUNTRIES,
  getMovieDetail,
  getMoviesByCountry,
  getMoviesByGenre,
  getMoviesByType,
  getNewMovies,
  searchMovies
} from './services/api';
import { getBookmarks, getWatchHistory } from './services/storage';
import { resetDefaultSEO } from './services/seo';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieGrid } from './components/MovieGrid';
import { MovieRow } from './components/MovieRow';
import { WatchView } from './components/WatchView';
import { Pagination } from './components/Pagination';
import { FavoritesHistoryModal } from './components/FavoritesHistoryModal';
import { SourceCodeModal } from './components/SourceCodeModal';

export default function App() {
  // Navigation & View states
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeFilter, setActiveFilter] = useState<{
    type: 'type' | 'genre' | 'country' | 'search';
    value: string;
    label: string;
  }>({
    type: 'type',
    value: 'phim-moi-cap-nhat',
    label: 'Phim Mới Cập Nhật',
  });

  // Movie list states
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [heroMovies, setHeroMovies] = useState<MovieItem[]>([]);
  const [paginate, setPaginate] = useState<PaginateInfo>({
    current_page: 1,
    total_page: 1,
    total_items: 0,
    items_per_page: 10,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Watch view states
  const [selectedMovieSlug, setSelectedMovieSlug] = useState<string | null>(null);
  const [movieDetail, setMovieDetail] = useState<MovieDetail | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<MovieItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Modal states
  const [isFavHistModalOpen, setIsFavHistModalOpen] = useState(false);
  const [favHistTab, setFavHistTab] = useState<'favorites' | 'history'>('favorites');
  const [isSourceCodeModalOpen, setIsSourceCodeModalOpen] = useState(false);

  // Storage counters
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  // Scroll to top button state
  const [showScrollTop, setShowScrollTop] = useState(false);

  const refreshCounters = useCallback(() => {
    setFavoritesCount(getBookmarks().length);
    setHistoryCount(getWatchHistory().length);
  }, []);

  useEffect(() => {
    refreshCounters();
  }, [refreshCounters]);

  // Scroll listener for jump-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch movies based on current filter & page
  const fetchMoviesData = useCallback(
    async (
      filterType: 'type' | 'genre' | 'country' | 'search',
      filterValue: string,
      page: number
    ) => {
      setIsLoading(true);
      try {
        let res;
        if (filterType === 'type') {
          res = await getMoviesByType(filterValue, page);
        } else if (filterType === 'genre') {
          res = await getMoviesByGenre(filterValue, page);
        } else if (filterType === 'country') {
          res = await getMoviesByCountry(filterValue, page);
        } else if (filterType === 'search') {
          res = await searchMovies(filterValue, page);
        } else {
          res = await getNewMovies(page);
        }

        if (res && res.items) {
          setMovies(res.items);
          if (res.paginate) {
            setPaginate(res.paginate);
          }

          // Set hero movies (10 movies) from first page of new releases
          if (filterType === 'type' && filterValue === 'phim-moi-cap-nhat' && page === 1) {
            setHeroMovies(res.items.slice(0, 10));
          } else if (heroMovies.length === 0 && res.items.length > 0) {
            setHeroMovies(res.items.slice(0, 10));
          }
        }
      } catch (err) {
        console.error('Failed to fetch movies list', err);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    },
    [heroMovies.length]
  );

  // Trigger data load on filter/page change
  useEffect(() => {
    if (viewMode !== 'watch') {
      fetchMoviesData(activeFilter.type, activeFilter.value, paginate.current_page);
      resetDefaultSEO(activeFilter.label);
    }
  }, [activeFilter, paginate.current_page, fetchMoviesData, viewMode]);

  // Handle movie selection -> switches to Watch view
  const handleSelectMovie = async (slug: string) => {
    setSelectedMovieSlug(slug);
    setViewMode('watch');
    setIsDetailLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const detail = await getMovieDetail(slug);
      setMovieDetail(detail);

      // Fetch related movies by matching genre or category
      try {
        let genreSlug = '';
        if (detail.category) {
          try {
            const catObj = detail.category as Record<string, { group?: { name: string }; list?: { name: string }[] }>;
            const catGroups = Object.values(catObj);
            for (const group of catGroups) {
              const gName = group.group?.name || '';
              if (gName.includes('Thể loại') && group.list && group.list.length > 0) {
                const firstCatName = group.list[0].name.trim();
                const matched = GENRES.find(
                  (g) => g.name.toLowerCase() === firstCatName.toLowerCase()
                );
                if (matched) {
                  genreSlug = matched.slug;
                  break;
                }
              }
            }
          } catch {
            // ignore
          }
        }

        let relatedRes;
        if (genreSlug) {
          relatedRes = await getMoviesByGenre(genreSlug, 1);
        } else {
          relatedRes = await getMoviesByType('phim-moi-cap-nhat', 1);
        }

        if (relatedRes && relatedRes.items) {
          setRelatedMovies(
            relatedRes.items.filter((item) => item.slug !== slug).slice(0, 30)
          );
        }
      } catch {
        // ignore related error
      }
    } catch (err) {
      console.error('Failed to fetch movie detail', err);
    } finally {
      setIsDetailLoading(false);
      refreshCounters();
    }
  };

  const handleNavigateHome = () => {
    setViewMode('home');
    setActiveFilter({
      type: 'type',
      value: 'phim-moi-cap-nhat',
      label: 'Phim Mới Cập Nhật',
    });
    setPaginate((prev) => ({ ...prev, current_page: 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (
    type: 'type' | 'genre' | 'country',
    value: string,
    label: string
  ) => {
    setViewMode('home');
    setActiveFilter({ type, value, label });
    setPaginate((prev) => ({ ...prev, current_page: 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (keyword: string) => {
    setViewMode('home');
    setActiveFilter({
      type: 'search',
      value: keyword,
      label: `Kết quả tìm kiếm: "${keyword}"`,
    });
    setPaginate((prev) => ({ ...prev, current_page: 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage: number) => {
    setPaginate((prev) => ({ ...prev, current_page: newPage }));
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDefaultHome =
    activeFilter.type === 'type' &&
    activeFilter.value === 'phim-moi-cap-nhat' &&
    paginate.current_page === 1;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#050505] text-slate-200 flex flex-col box-border selection:bg-purple-600 selection:text-white">
      {/* Sticky Glassmorphism Header */}
      <Navbar
        currentView={viewMode}
        activeFilter={activeFilter}
        onNavigateHome={handleNavigateHome}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onSelectMovie={handleSelectMovie}
        onOpenFavorites={() => {
          setFavHistTab('favorites');
          setIsFavHistModalOpen(true);
        }}
        onOpenHistory={() => {
          setFavHistTab('history');
          setIsFavHistModalOpen(true);
        }}
        onOpenSourceCode={() => setIsSourceCodeModalOpen(true)}
        favoritesCount={favoritesCount}
        historyCount={historyCount}
      />

      {/* Main Content Area */}
      <main
        style={{ position: 'relative', zIndex: 1 }}
        className="relative z-[1] flex-1 w-full max-w-[100vw] overflow-x-hidden box-border"
      >
        {viewMode === 'home' && (
          <div className="w-full max-w-full">
            {/* Hero Banner (10 Movies Carousel on Home) */}
            {isDefaultHome && heroMovies.length > 0 && (
              <HeroBanner
                movies={heroMovies}
                onWatchMovie={handleSelectMovie}
                onViewDetail={handleSelectMovie}
                onBookmarkChanged={refreshCounters}
                onSelectCategory={handleSelectCategory}
              />
            )}

            {/* Horizontal Category Rows & Genre Slider on Default Home */}
            {isDefaultHome ? (
              <div className="movie-sections space-y-2 sm:space-y-4 mt-2 sm:mt-3 mb-12 w-full max-w-full">
                {/* 1. Phim Mới Cập Nhật (30 Phim) */}
                <MovieRow
                  title="Phim Mới Cập Nhật"
                  subtitle="Tổng hợp các bộ phim bom tấn và tập phim mới lên sóng hôm nay"
                  categorySlug="phim-moi-cap-nhat"
                  onSelectMovie={handleSelectMovie}
                  onViewAll={() => handleSelectCategory('type', 'phim-moi-cap-nhat', 'Phim Mới Cập Nhật')}
                  onBookmarkChanged={refreshCounters}
                />

                {/* 2. Phim Bộ (30 Phim) */}
                <MovieRow
                  title="Phim Bộ"
                  subtitle="Những bộ phim truyền hình dài tập đình đám nhất hiện nay"
                  categorySlug="phim-bo"
                  onSelectMovie={handleSelectMovie}
                  onViewAll={() => handleSelectCategory('type', 'phim-bo', 'Phim Bộ')}
                  onBookmarkChanged={refreshCounters}
                />

                {/* 3. Phim Lẻ (30 Phim) */}
                <MovieRow
                  title="Phim Lẻ"
                  subtitle="Phim chiếu rạp, bom tấn hành động đỉnh cao chất lượng Full HD"
                  categorySlug="phim-le"
                  onSelectMovie={handleSelectMovie}
                  onViewAll={() => handleSelectCategory('type', 'phim-le', 'Phim Lẻ')}
                  onBookmarkChanged={refreshCounters}
                />

                {/* 4. Hoạt Hình & Anime (30 Phim) */}
                <MovieRow
                  title="Hoạt Hình & Anime"
                  subtitle="Thế giới Anime Nhật Bản, 3D Trung Quốc và hoạt hình chiếu rạp sống động"
                  categorySlug="hoat-hinh"
                  onSelectMovie={handleSelectMovie}
                  onViewAll={() => handleSelectCategory('type', 'hoat-hinh', 'Hoạt Hình & Anime')}
                  onBookmarkChanged={refreshCounters}
                />

                {/* 5. TV Shows (30 Phim) */}
                <MovieRow
                  title="TV Shows"
                  subtitle="Các chương trình truyền hình thực tế, gameshow giải trí hấp dẫn"
                  categorySlug="tv-shows"
                  onSelectMovie={handleSelectMovie}
                  onViewAll={() => handleSelectCategory('type', 'tv-shows', 'TV Shows')}
                  onBookmarkChanged={refreshCounters}
                />
              </div>
            ) : (
              /* Movie Grid Section (Hiển thị 60 phim khi xem chi tiết danh mục hoặc tìm kiếm) */
              <div className="w-full max-w-full px-[15px] md:px-[40px] box-border pt-24 pb-12">
                <MovieGrid
                  title={activeFilter.label}
                  subtitle={
                    activeFilter.type === 'search'
                      ? `Kết quả tìm kiếm cho: "${activeFilter.value}"`
                      : undefined
                  }
                  movies={movies}
                  isLoading={isLoading}
                  onSelectMovie={handleSelectMovie}
                  onBookmarkChanged={refreshCounters}
                  onRetry={() => fetchMoviesData(activeFilter.type, activeFilter.value, paginate.current_page)}
                />

                {/* Pagination Controls */}
                {!isLoading && movies.length > 0 && (
                  <Pagination
                    paginate={paginate}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Watch View Screen */}
        {viewMode === 'watch' && (
          <div>
            {isDetailLoading ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 pt-24">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <p className="text-slate-400 text-sm font-semibold animate-pulse">
                  Đang tải thông tin phim và nguồn phát Full HD...
                </p>
              </div>
            ) : movieDetail ? (
              <WatchView
                movie={movieDetail}
                relatedMovies={relatedMovies}
                onBack={handleNavigateHome}
                onSelectMovie={handleSelectMovie}
                onBookmarkChanged={refreshCounters}
                onSelectCategory={handleSelectCategory}
              />
            ) : (
              <div className="min-h-[50vh] flex flex-col items-center justify-center pt-24 text-center space-y-4">
                <p className="text-white font-bold text-lg">Không thể tải thông tin bộ phim này.</p>
                <button
                  onClick={handleNavigateHome}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:scale-105 transition-all cursor-pointer"
                >
                  Quay lại trang chủ
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          title="Lên đầu trang"
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 backdrop-blur-sm transition-all transform hover:-translate-y-1 font-bold cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Favorites & History Modal */}
      <FavoritesHistoryModal
        isOpen={isFavHistModalOpen}
        initialTab={favHistTab}
        bookmarks={getBookmarks()}
        history={getWatchHistory()}
        onClose={() => setIsFavHistModalOpen(false)}
        onSelectMovie={handleSelectMovie}
        onRefreshData={refreshCounters}
      />

      {/* Standalone Source Code Modal (HTML/CSS/JS for GitHub Pages) */}
      <SourceCodeModal
        isOpen={isSourceCodeModalOpen}
        onClose={() => setIsSourceCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 bg-[#050505] py-8 sm:py-12 text-slate-400 text-xs sm:text-sm">
        <div className="w-full max-w-full px-[15px] md:px-[40px] space-y-6 sm:space-y-8 box-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {/* Logo and Brand Name - Centered on mobile, left-aligned on desktop/tablet */}
            <div className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black p-0.5 shadow-lg shadow-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <img
                    src="/logo.jpg"
                    alt="Logo Xóm Phim"
                    className="w-full h-full object-cover rounded-[8px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-heading font-black text-xl text-white tracking-wider">
                  XÓM <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">PHIM</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 tracking-wider">
                  FULL HD
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Cả xóm cùng xem phim
              </p>

              {/* Telegram Community Button */}
              <a
                id="footer-telegram-btn"
                href="https://t.me/+NikcMc8yA4JlM2Y1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-[#229ED9] hover:bg-[#1da1f2] text-white text-xs sm:text-sm font-bold rounded-[20px] shadow-[0_4px_14px_rgba(34,158,217,0.35)] hover:shadow-[0_0_22px_rgba(34,158,217,0.65)] hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 group border border-white/15 cursor-pointer"
                title="Gia Nhập Nhóm Telegram Xóm Phim"
              >
                <svg
                  className="w-4 h-4 fill-current group-hover:rotate-6 transition-transform duration-300 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span className="whitespace-nowrap">Gia Nhập Nhóm Telegram</span>
              </a>
            </div>

            {/* Phân Loại - Hidden on Mobile, preserved on Desktop & Tablet */}
            <div className="hidden md:block">
              <h4 className="font-bold text-white uppercase text-xs sm:text-sm tracking-wider mb-3">
                Phân Loại
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => handleSelectCategory('type', 'phim-moi-cap-nhat', 'Phim Mới Cập Nhật')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Phim Mới Cập Nhật
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectCategory('type', 'phim-bo', 'Phim Bộ')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Phim Bộ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectCategory('type', 'phim-le', 'Phim Lẻ')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Phim Lẻ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectCategory('type', 'hoat-hinh', 'Hoạt Hình & Anime')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Hoạt Hình & Anime
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectCategory('type', 'tv-shows', 'TV Shows')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    TV Shows
                  </button>
                </li>
              </ul>
            </div>

            {/* Thể Loại Phim - Hidden on Mobile, preserved on Desktop & Tablet */}
            <div className="hidden md:block">
              <h4 className="font-bold text-white uppercase text-xs sm:text-sm tracking-wider mb-3">
                Thể Loại Phim
              </h4>
              <ul className="space-y-2 text-slate-400">
                {GENRES.slice(0, 6).map((g) => (
                  <li key={g.slug}>
                    <button
                      onClick={() => handleSelectCategory('genre', g.slug, g.name)}
                      className="hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      {g.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quốc Gia - Hidden on Mobile, preserved on Desktop & Tablet */}
            <div className="hidden md:block">
              <h4 className="font-bold text-white uppercase text-xs sm:text-sm tracking-wider mb-3">
                Quốc Gia
              </h4>
              <ul className="space-y-2 text-slate-400">
                {COUNTRIES.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <button
                      onClick={() => handleSelectCategory('country', c.slug, c.name)}
                      className="hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
            <p>&copy; 2026 Xóm Phim - Cả xóm cùng xem phim.</p>
            <p>Trải nghiệm xem phim trực tuyến đỉnh cao, không giới hạn.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

