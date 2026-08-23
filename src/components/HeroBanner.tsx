import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Info,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Globe,
  Film,
  Tv,
  Sparkles,
  Volume2,
  Captions,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MovieItem } from '../types/movie';
import { isBookmarked, toggleBookmark } from '../services/storage';

interface HeroBannerProps {
  movies: MovieItem[];
  onWatchMovie: (slug: string) => void;
  onViewDetail: (slug: string) => void;
  onBookmarkChanged?: () => void;
  onSelectCategory?: (type: 'type' | 'genre' | 'country', value: string, title?: string) => void;
}

interface MovieMetadata {
  classificationName: string;
  classificationSlug: string;
  countryDisplay: string;
  countrySlug: string;
  isVietsub: boolean;
  isThuyetMinh: boolean;
}

const KNOWN_COUNTRIES = [
  { name: 'Thái Lan', slug: 'thai-lan', keywords: ['thái lan', 'thai', 'thailand', 'thái'] },
  { name: 'Hàn Quốc', slug: 'han-quoc', keywords: ['hàn quốc', 'korea', 'korean', 'hàn'] },
  { name: 'Trung Quốc', slug: 'trung-quoc', keywords: ['trung quốc', 'china', 'chinese', 'hoa ngữ', 'c-drama', 'đại lục', 'trung'] },
  { name: 'Nhật Bản', slug: 'nhat-ban', keywords: ['nhật bản', 'japan', 'japanese', 'nhật', 'tokyo'] },
  { name: 'Âu Mỹ', slug: 'au-my', keywords: ['âu mỹ', 'hollywood', 'mỹ', 'usa', 'united states', 'uk', 'anh', 'pháp', 'đức', 'tây ban nha'] },
  { name: 'Việt Nam', slug: 'viet-nam', keywords: ['việt nam', 'vietnam', 'viet'] },
  { name: 'Đài Loan', slug: 'dai-loan', keywords: ['đài loan', 'taiwan'] },
  { name: 'Hồng Kông', slug: 'hong-kong', keywords: ['hồng kông', 'hong kong', 'tvb'] },
  { name: 'Ấn Độ', slug: 'an-do', keywords: ['ấn độ', 'india', 'bollywood'] },
];

function extractMovieMetadata(movie: MovieItem): MovieMetadata {
  const categoriesList: string[] = [];
  let countryName = '';
  let formatType = '';

  if (movie.category) {
    try {
      const catObj = movie.category as Record<
        string,
        { group?: { name: string }; list?: { name: string }[] }
      >;
      Object.values(catObj).forEach((group) => {
        const gName = group?.group?.name || '';
        if (group?.list && Array.isArray(group.list)) {
          group.list.forEach((item) => {
            if (gName.includes('Quốc gia')) {
              countryName = item.name;
            } else if (gName.includes('Định dạng')) {
              formatType = item.name;
            } else if (item.name) {
              if (!categoriesList.includes(item.name)) {
                categoriesList.push(item.name);
              }
            }
          });
        }
      });
    } catch {
      // ignore
    }
  }

  const allMetaStrings = [
    formatType,
    countryName,
    ...categoriesList,
    movie.name || '',
    movie.original_name || '',
    movie.slug || '',
    movie.description || '',
  ].map((s) => s.toLowerCase());

  // 1. Phân loại: "Phim Bộ", "Phim Lẻ", "Hoạt Hình & Anime", "TV Shows"
  let classificationName = 'Phim Bộ';
  let classificationSlug = 'phim-bo';

  const isAnimeOrAnimation = allMetaStrings.some(
    (s) =>
      s.includes('hoạt hình') ||
      s.includes('anime') ||
      s.includes('animation') ||
      s.includes('hoat-hinh')
  );

  const isTvShow = allMetaStrings.some(
    (s) =>
      s.includes('tv show') ||
      s.includes('tvshow') ||
      s.includes('tv-shows') ||
      s.includes('gameshow') ||
      s.includes('truyền hình') ||
      s.includes('show')
  );

  if (isAnimeOrAnimation) {
    classificationName = 'Hoạt Hình & Anime';
    classificationSlug = 'hoat-hinh';
  } else if (isTvShow) {
    classificationName = 'TV Shows';
    classificationSlug = 'tv-shows';
  } else {
    const isExplicitSingle =
      allMetaStrings.some(
        (s) =>
          s.includes('phim lẻ') ||
          s.includes('phim le') ||
          s.includes('movie') ||
          s.includes('single')
      ) || formatType.toLowerCase().includes('lẻ');

    const isExplicitSeries =
      allMetaStrings.some(
        (s) =>
          s.includes('phim bộ') ||
          s.includes('phim bo') ||
          s.includes('series') ||
          s.includes('drama')
      ) ||
      (typeof movie.total_episodes === 'number' && movie.total_episodes > 1) ||
      (movie.current_episode &&
        (movie.current_episode.toLowerCase().includes('tập') ||
          movie.current_episode.includes('/') ||
          (/\d+/.test(movie.current_episode) &&
            !movie.current_episode.toLowerCase().includes('full'))));

    if (isExplicitSingle && !isExplicitSeries) {
      classificationName = 'Phim Lẻ';
      classificationSlug = 'phim-le';
    } else if (isExplicitSeries) {
      classificationName = 'Phim Bộ';
      classificationSlug = 'phim-bo';
    } else if (movie.total_episodes === 1) {
      classificationName = 'Phim Lẻ';
      classificationSlug = 'phim-le';
    } else {
      classificationName = 'Phim Bộ';
      classificationSlug = 'phim-bo';
    }
  }

  // 2. Quốc gia
  let countryDisplay = 'Quốc Tế';
  let countrySlug = 'quoc-te';

  if (countryName) {
    const matched = KNOWN_COUNTRIES.find((c) =>
      c.keywords.some((kw) => countryName.toLowerCase().includes(kw))
    );
    if (matched) {
      countryDisplay = matched.name;
      countrySlug = matched.slug;
    } else {
      countryDisplay = countryName;
      countrySlug = countryName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  } else {
    for (const c of KNOWN_COUNTRIES) {
      if (c.keywords.some((kw) => allMetaStrings.some((str) => str.includes(kw)))) {
        countryDisplay = c.name;
        countrySlug = c.slug;
        break;
      }
    }
  }

  // 3. Vietsub & Thuyết Minh
  const isVietsub = true;
  const isThuyetMinh = true;

  return {
    classificationName,
    classificationSlug,
    countryDisplay,
    countrySlug,
    isVietsub,
    isThuyetMinh,
  };
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  onWatchMovie,
  onViewDetail,
  onBookmarkChanged,
  onSelectCategory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const touchStartX = useRef<number | null>(null);

  // Top 10 featured hot movies
  const featuredMovies = movies.slice(0, 10);
  const currentMovie = featuredMovies[currentIndex] || movies[0];

  useEffect(() => {
    if (currentMovie) {
      setSaved(isBookmarked(currentMovie.slug));
    }
  }, [currentMovie]);

  // Auto slide every 6 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredMovies.length, isPaused]);

  const handleToggleSave = () => {
    if (!currentMovie) return;
    const nowSaved = toggleBookmark(currentMovie);
    setSaved(nowSaved);
    if (onBookmarkChanged) onBookmarkChanged();
  };

  if (!currentMovie) return null;

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  const handleGoTo = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Touch Swipe Support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const metadata = extractMovieMetadata(currentMovie);
  const bgImage = currentMovie.poster_url || currentMovie.thumb_url;

  // Animation variants for smooth sliding transition
  const contentSlideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
      filter: 'blur(2px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.35, ease: 'easeOut' },
        filter: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      filter: 'blur(2px)',
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.25, ease: 'easeIn' },
        filter: { duration: 0.25 },
      },
    }),
  };

  const posterSlideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      scale: 0.96,
      opacity: 0,
    }),
    center: {
      x: 0,
      scale: 1,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 26 },
        scale: { duration: 0.35 },
        opacity: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      scale: 0.96,
      opacity: 0,
      transition: {
        duration: 0.25,
      },
    }),
  };

  return (
    <div
      id="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="hero-section relative w-full flex items-center overflow-hidden select-none"
      style={{
        minHeight: 'auto',
        paddingTop: '90px',
        paddingBottom: '20px',
        marginBottom: '0px',
      }}
    >
      {/* Background Backdrop with ultra-smooth Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentMovie.slug}
            src={bgImage}
            alt={currentMovie.name}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.38]"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Layered Cinematic Gradient Fades */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent w-full md:w-3/4 lg:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-[#050505]" />
      </div>

      {/* Hero Content Container */}
      <div className="hero-content hero-content-inner relative z-10 w-full max-w-full px-3.5 sm:px-6 lg:px-10 xl:px-12 pt-0 pb-4 box-border">
        
        {/* ========================================================================= */}
        {/* MOBILE & TABLET PORTRAIT LAYOUT (< 1024px): TOP IS IMAGE, BOTTOM IS INFO */}
        {/* ========================================================================= */}
        <div className="block lg:hidden w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentMovie.slug}
              custom={direction}
              variants={contentSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center space-y-3.5 sm:space-y-4"
            >
              {/* 1. TOP: HERO IMAGE CARD (Phía trên là hình) */}
              <div
                onClick={() => onWatchMovie(currentMovie.slug)}
                className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-2xl group cursor-pointer aspect-[16/10] sm:aspect-[16/9] max-h-[320px]"
              >
                <img
                  src={currentMovie.poster_url || currentMovie.thumb_url}
                  alt={currentMovie.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/600x350/181818/ffffff?text=Xóm+Phim';
                  }}
                />
                {/* Soft gradient fade at the bottom of the image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />

                {/* Top-left Badges on Image */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] sm:text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/40 uppercase">
                    <Flame className="w-3 h-3 fill-white" />
                    Top {currentIndex + 1} Hot
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-black/70 text-pink-300 border border-pink-500/30 backdrop-blur-md">
                    {currentMovie.quality || 'Full HD'}
                  </span>
                </div>

                {/* Center Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 transform group-hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom-right Time/Episode Badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                  {currentMovie.time && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-black/80 text-slate-200 border border-white/10 backdrop-blur-md">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {currentMovie.time}
                    </span>
                  )}
                  {currentMovie.current_episode && (
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-950/80 text-purple-200 border border-purple-500/40 backdrop-blur-md">
                      {currentMovie.current_episode}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. BOTTOM: INFORMATION DETAILS (Phía dưới thông tin) */}
              <div className="w-full text-center space-y-2.5 sm:space-y-3">
                {/* Title & Subtitle */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading leading-snug drop-shadow-xl">
                    {currentMovie.name}
                  </h1>
                  {currentMovie.original_name && (
                    <p className="text-xs sm:text-sm text-purple-300 font-semibold mt-0.5 tracking-wide">
                      {currentMovie.original_name}
                    </p>
                  )}
                </div>

                {/* Tags row: Phân loại, Quốc gia, Vietsub, Thuyết Minh */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
                  {/* Phân loại */}
                  <button
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory('type', metadata.classificationSlug, metadata.classificationName);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    {metadata.classificationSlug === 'phim-bo' || metadata.classificationSlug === 'tv-shows' ? (
                      <Tv className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Film className="w-3 h-3 text-purple-400" />
                    )}
                    <span>{metadata.classificationName}</span>
                  </button>

                  {/* Quốc gia */}
                  <button
                    onClick={() => {
                      if (onSelectCategory && metadata.countrySlug) {
                        onSelectCategory('country', metadata.countrySlug, metadata.countryDisplay);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-500/40 hover:bg-blue-500/30 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span>{metadata.countryDisplay}</span>
                  </button>

                  {/* Vietsub */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                    <Captions className="w-3 h-3 text-emerald-400" />
                    <span>Vietsub</span>
                  </span>

                  {/* Thuyết Minh */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40 backdrop-blur-md shadow-sm">
                    <Volume2 className="w-3 h-3 text-amber-400" />
                    <span>Thuyết Minh</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl mx-auto leading-relaxed drop-shadow-md">
                  {currentMovie.description
                    ? currentMovie.description.replace(/<[^>]*>?/gm, '')
                    : 'Thưởng thức trọn vẹn bộ phim bản quyền chất lượng cao, hình ảnh sắc nét, âm thanh sống động với tốc độ tải nhanh mượt mà trên Xóm Phim.'}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-1">
                  <button
                    id="hero-btn-watch-mobile"
                    onClick={() => onWatchMovie(currentMovie.slug)}
                    className="flex-1 max-w-[180px] sm:max-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/40 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>XEM NGAY</span>
                  </button>

                  <button
                    id="hero-btn-detail-mobile"
                    onClick={() => onViewDetail(currentMovie.slug)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 active:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-purple-300" />
                    <span>Chi Tiết</span>
                  </button>

                  <button
                    id="hero-btn-save-mobile"
                    onClick={handleToggleSave}
                    title={saved ? 'Đã lưu vào Yêu thích' : 'Lưu vào Yêu thích'}
                    className={`p-2.5 rounded-xl border transition-all backdrop-blur-md cursor-pointer ${
                      saved
                        ? 'bg-pink-600/30 border-pink-500 text-pink-400 shadow-md shadow-pink-600/30'
                        : 'bg-white/10 border-white/20 text-slate-200 active:text-pink-400'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-pink-400' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP & LANDSCAPE TABLET LAYOUT (>= 1024px): 2 COLUMNS (LEFT / RIGHT) */}
        {/* ========================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 items-center min-h-[380px] xl:min-h-[420px]">
          {/* Left Text and CTA */}
          <div className="lg:col-span-8 max-w-3xl overflow-hidden py-2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentMovie.slug}
                custom={direction}
                variants={contentSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-3 sm:space-y-4"
              >
                {/* Top Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    Top {currentIndex + 1} Phim Hot Trong Tuần
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white/10 text-pink-300 border border-pink-500/30 backdrop-blur-sm">
                    {currentMovie.quality || 'Full HD'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/60 text-slate-200 border border-white/10 backdrop-blur-sm">
                    {currentMovie.current_episode || 'Mới cập nhật'}
                  </span>
                  {currentMovie.time && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-300 bg-black/60 border border-white/10 backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {currentMovie.time}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-heading leading-snug drop-shadow-2xl">
                    {currentMovie.name}
                  </h1>
                  {currentMovie.original_name && (
                    <p className="text-xs sm:text-sm md:text-base text-purple-300 font-semibold mt-1 tracking-wide">
                      {currentMovie.original_name}
                    </p>
                  )}
                </div>

                {/* Badges: Phân loại, Quốc gia, Vietsub, Thuyết Minh */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {/* Phân loại */}
                  <button
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory('type', metadata.classificationSlug, metadata.classificationName);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 hover:border-purple-400 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                    title={`Xem thêm ${metadata.classificationName}`}
                  >
                    {metadata.classificationSlug === 'phim-bo' || metadata.classificationSlug === 'tv-shows' ? (
                      <Tv className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>{metadata.classificationName}</span>
                  </button>

                  {/* Quốc gia */}
                  <button
                    onClick={() => {
                      if (onSelectCategory && metadata.countrySlug) {
                        onSelectCategory('country', metadata.countrySlug, metadata.countryDisplay);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-400 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                    title={`Phim ${metadata.countryDisplay}`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>{metadata.countryDisplay}</span>
                  </button>

                  {/* Vietsub */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                    <Captions className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vietsub</span>
                  </span>

                  {/* Thuyết Minh */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40 backdrop-blur-md shadow-sm">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thuyết Minh</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-3 max-w-2xl leading-relaxed drop-shadow-md">
                  {currentMovie.description
                    ? currentMovie.description.replace(/<[^>]*>?/gm, '')
                    : 'Thưởng thức trọn vẹn bộ phim bản quyền chất lượng cao, hình ảnh sắc nét, âm thanh sống động với tốc độ tải nhanh mượt mà trên Xóm Phim.'}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  <button
                    id="hero-btn-watch-desktop"
                    onClick={() => onWatchMovie(currentMovie.slug)}
                    className="group flex items-center gap-2.5 px-7 sm:px-9 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 transition-all duration-200 transform hover:scale-105 cursor-pointer uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>XEM NGAY</span>
                  </button>

                  <button
                    id="hero-btn-detail-desktop"
                    onClick={() => onViewDetail(currentMovie.slug)}
                    className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all duration-200 border border-white/20 hover:border-white/40 backdrop-blur-md cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-purple-300" />
                    <span>Chi Tiết</span>
                  </button>

                  <button
                    id="hero-btn-save-desktop"
                    onClick={handleToggleSave}
                    title={saved ? 'Đã lưu vào Yêu thích' : 'Lưu vào Yêu thích'}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 backdrop-blur-md cursor-pointer ${
                      saved
                        ? 'bg-pink-600/30 border-pink-500 text-pink-400 shadow-lg shadow-pink-600/30'
                        : 'bg-white/10 border-white/20 text-slate-200 hover:text-pink-400 hover:bg-white/20'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-pink-400' : ''}`} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Poster Visual with AnimatePresence Slide Animation */}
          <div className="lg:col-span-4 flex justify-center items-center self-center relative overflow-hidden py-2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentMovie.slug}
                custom={direction}
                variants={posterSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="hero-poster-container relative group cursor-pointer"
                style={{
                  width: '300px',
                  maxWidth: '25vw',
                  height: 'auto',
                  aspectRatio: '2 / 3',
                }}
                onClick={() => onWatchMovie(currentMovie.slug)}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[12px] blur-md opacity-30 group-hover:opacity-75 transition duration-500 pointer-events-none" />
                <div
                  className="poster-container relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{
                    width: '100%',
                    height: '100%',
                    aspectRatio: '2 / 3',
                    borderRadius: '12px',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <img
                    src={currentMovie.thumb_url || currentMovie.poster_url}
                    alt={currentMovie.name}
                    className="transform group-hover:scale-105 transition-transform duration-500"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/300x450/181818/ffffff?text=Xóm+Phim';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[12px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CAROUSEL SLIDER CONTROLS (10 Dots & Prev/Next Arrows) */}
        {/* ========================================================================= */}
        {featuredMovies.length > 1 && (
          <div className="flex items-center justify-between mt-5 sm:mt-7 pt-3.5 border-t border-white/10">
            {/* 10 Navigation Dots */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
              {featuredMovies.map((movie, idx) => (
                <button
                  key={movie.slug}
                  onClick={() => handleGoTo(idx)}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
                    idx === currentIndex
                      ? 'w-6 sm:w-9 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 shadow-md shadow-purple-500/50'
                      : 'w-2 sm:w-2.5 bg-white/20 hover:bg-white/50'
                  }`}
                  title={`Top ${idx + 1}: ${movie.name}`}
                />
              ))}
            </div>

            {/* Arrows with Smooth Feedback */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handlePrev}
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-purple-600 text-white border border-white/15 hover:border-purple-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Phim trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-purple-600 text-white border border-white/15 hover:border-purple-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Phim tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
