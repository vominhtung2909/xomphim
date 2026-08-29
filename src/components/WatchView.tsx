import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Moon,
  Sun,
  Bookmark,
  Sparkles,
  Server,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Film,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Tag,
  Tv
} from 'lucide-react';
import { CategoryGroup, EpisodeItem, EpisodeServer, MovieDetail, MovieItem } from '../types/movie';
import { isBookmarked, saveWatchProgress, toggleBookmark } from '../services/storage';
import { GENRES, COUNTRIES } from '../services/api';
import { injectMovieSchema, injectBreadcrumbSchema, resetDefaultSEO } from '../services/seo';
import { MovieRow } from './MovieRow';

function findGenreSlug(genreName: string): string {
  const clean = genreName.trim().toLowerCase();
  const found = GENRES.find((g) => g.name.toLowerCase() === clean);
  if (found) return found.slug;

  if (clean.includes('hài')) return 'hai-huoc';
  if (clean.includes('hành động')) return 'hanh-dong';
  if (clean.includes('tình cảm') || clean.includes('lãng mạn')) return 'tinh-cam';
  if (clean.includes('cổ trang')) return 'co-trang';
  if (clean.includes('tâm lý')) return 'tam-ly';
  if (clean.includes('võ thuật')) return 'vo-thuat';
  if (clean.includes('viễn tưởng')) return 'vien-tuong';
  if (clean.includes('phiêu lưu')) return 'phieu-luu';
  if (clean.includes('kinh dị')) return 'kinh-di';
  if (clean.includes('khoa học')) return 'khoa-hoc';
  if (clean.includes('thần thoại')) return 'than-thoai';
  if (clean.includes('chính kịch')) return 'chinh-kich';
  if (clean.includes('bí ẩn')) return 'bi-an';
  if (clean.includes('học đường')) return 'hoc-duong';
  if (clean.includes('âm nhạc')) return 'am-nhac';
  if (clean.includes('gia đình')) return 'gia-dinh';
  if (clean.includes('tài liệu')) return 'tai-lieu';
  if (clean.includes('chiến tranh')) return 'chien-tranh';
  if (clean.includes('thể thao')) return 'the-thao';
  if (clean.includes('kinh điển')) return 'kinh-dien';
  if (clean.includes('hình sự')) return 'hinh-su';
  if (clean.includes('hoạt hình') || clean.includes('anime')) return 'hoat-hinh';

  return genreName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function findCountrySlug(countryName: string): string {
  const clean = countryName.trim().toLowerCase();
  const found = COUNTRIES.find((c) => c.name.toLowerCase() === clean);
  if (found) return found.slug;

  if (clean.includes('hàn') || clean.includes('korea')) return 'han-quoc';
  if (clean.includes('trung') || clean.includes('china')) return 'trung-quoc';
  if (clean.includes('nhật') || clean.includes('japan')) return 'nhat-ban';
  if (clean.includes('âu') || clean.includes('mỹ') || clean.includes('us') || clean.includes('united states') || clean.includes('america')) return 'au-my';
  if (clean.includes('thái') || clean.includes('thai')) return 'thai-lan';
  if (clean.includes('việt') || clean.includes('vietnam')) return 'viet-nam';
  if (clean.includes('đài') || clean.includes('taiwan')) return 'dai-loan';
  if (clean.includes('hồng') || clean.includes('hong kong')) return 'hong-kong';
  if (clean.includes('ấn') || clean.includes('india')) return 'an-do';

  return countryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface WatchViewProps {
  movie: MovieDetail;
  initialServerIndex?: number;
  initialEpisodeIndex?: number;
  relatedMovies: MovieItem[];
  onBack: () => void;
  onSelectMovie: (slug: string) => void;
  onBookmarkChanged?: () => void;
  onSelectCategory?: (type: 'type' | 'genre' | 'country', value: string, label: string) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  movie,
  initialServerIndex = 0,
  initialEpisodeIndex = 0,
  relatedMovies,
  onBack,
  onSelectMovie,
  onBookmarkChanged,
  onSelectCategory,
}) => {
  const [currentServerIndex, setCurrentServerIndex] = useState(initialServerIndex);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(initialEpisodeIndex);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [activeChunk, setActiveChunk] = useState(0);
  const [isSaved, setIsSaved] = useState(() => isBookmarked(movie.slug));
  const [copied, setCopied] = useState(false);
  const [playerKey, setPlayerKey] = useState(Date.now());
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>({});

  const playerRef = useRef<HTMLDivElement>(null);

  const servers: EpisodeServer[] = movie?.episodes || [];
  const currentServer: EpisodeServer | undefined = servers[currentServerIndex] || servers[0];
  const episodes: EpisodeItem[] = currentServer?.items || [];
  const activeEpisode: EpisodeItem | undefined = episodes[currentEpisodeIndex] || episodes[0];

  // Save watch progress on episode change
  useEffect(() => {
    if (movie && currentServer && activeEpisode) {
      saveWatchProgress(
        movie,
        currentServerIndex,
        currentServer.server_name,
        currentEpisodeIndex,
        activeEpisode.name,
        activeEpisode.slug
      );

      const key = `${movie.slug}_${currentServerIndex}_${currentEpisodeIndex}`;
      setWatchedEpisodes((prev) => ({ ...prev, [key]: true }));
    }
  }, [movie, currentServerIndex, currentEpisodeIndex, currentServer, activeEpisode]);

  // Dynamically inject JSON-LD Schema
  useEffect(() => {
    if (movie) {
      injectMovieSchema(movie, activeEpisode?.name);

      let genreName = 'Phim';
      if (movie.category) {
        try {
          const catGroups = Object.values(movie.category) as CategoryGroup[];
          for (const g of catGroups) {
            if (g.group?.name?.includes('Thể loại') && g.list?.[0]) {
              genreName = g.list[0].name;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      injectBreadcrumbSchema([
        { name: 'Trang Chủ', url: '/' },
        { name: genreName, url: `/?the-loai=${movie.slug}` },
        { name: movie.name, url: `/phim/${movie.slug}` },
      ]);
    }

    return () => {
      resetDefaultSEO();
    };
  }, [movie, activeEpisode?.name]);

  const handleSelectEpisode = (epIdx: number) => {
    setCurrentEpisodeIndex(epIdx);
    setPlayerKey(Date.now());
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectServer = (srvIdx: number) => {
    setCurrentServerIndex(srvIdx);
    setCurrentEpisodeIndex(0);
    setPlayerKey(Date.now());
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      handleSelectEpisode(currentEpisodeIndex - 1);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisodeIndex < episodes.length - 1) {
      handleSelectEpisode(currentEpisodeIndex + 1);
    }
  };

  const handleReloadPlayer = () => {
    setPlayerKey(Date.now());
  };

  const handleToggleBookmark = () => {
    const nextState = toggleBookmark(movie);
    setIsSaved(nextState);
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const CHUNK_SIZE = 50;
  const totalChunks = Math.ceil(episodes.length / CHUNK_SIZE);
  const currentChunkEpisodes =
    episodes.length > CHUNK_SIZE
      ? episodes.slice(activeChunk * CHUNK_SIZE, (activeChunk + 1) * CHUNK_SIZE)
      : episodes;

  const filteredEpisodes = episodeSearch.trim()
    ? episodes.filter((ep) =>
        ep.name.toLowerCase().includes(episodeSearch.trim().toLowerCase()) ||
        ep.slug.toLowerCase().includes(episodeSearch.trim().toLowerCase())
      )
    : currentChunkEpisodes;

  const categoriesList: string[] = [];
  let countryName = '';
  let releaseYear = '';
  let formatType = '';
  let statusName = '';

  if (movie?.category) {
    try {
      const catObj = movie.category as Record<string, { group?: { name: string }; list?: { name: string }[] }>;
      Object.values(catObj).forEach((group) => {
        const gName = group?.group?.name || '';
        if (group?.list && Array.isArray(group.list)) {
          group.list.forEach((item) => {
            if (gName.includes('Quốc gia')) {
              countryName = item.name;
            } else if (gName.includes('Năm')) {
              releaseYear = item.name;
            } else if (gName.includes('Định dạng')) {
              formatType = item.name;
            } else if (gName.includes('Tình trạng')) {
              statusName = item.name;
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
    ...categoriesList,
    movie?.name || '',
    movie?.original_name || '',
    movie?.slug || '',
  ].map((s) => s.toLowerCase());

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
      allMetaStrings.some((s) => s.includes('phim lẻ') || s.includes('phim le') || s.includes('movie') || s.includes('single')) ||
      formatType.toLowerCase().includes('lẻ');

    const isExplicitSeries =
      allMetaStrings.some((s) => s.includes('phim bộ') || s.includes('phim bo') || s.includes('series') || s.includes('drama')) ||
      (movie?.total_episodes && movie.total_episodes > 1) ||
      (movie?.current_episode &&
        (movie.current_episode.toLowerCase().includes('tập') ||
          movie.current_episode.includes('/') ||
          (/\d+/.test(movie.current_episode) && !movie.current_episode.toLowerCase().includes('full'))));

    if (isExplicitSingle && !isExplicitSeries) {
      classificationName = 'Phim Lẻ';
      classificationSlug = 'phim-le';
    } else if (isExplicitSeries) {
      classificationName = 'Phim Bộ';
      classificationSlug = 'phim-bo';
    } else if (movie?.total_episodes === 1) {
      classificationName = 'Phim Lẻ';
      classificationSlug = 'phim-le';
    } else {
      classificationName = 'Phim Bộ';
      classificationSlug = 'phim-bo';
    }
  }

  let statusDisplay = '';
  const currentEpRaw = (movie?.current_episode || '').trim();
  const currentEpLower = currentEpRaw.toLowerCase();
  const statusNameLower = statusName.toLowerCase();

  let isEnded = false;
  if (
    currentEpLower.includes('full') ||
    currentEpLower.includes('hoàn tất') ||
    currentEpLower.includes('hoàn thành') ||
    currentEpLower.includes('trọn bộ') ||
    currentEpLower.includes('end') ||
    currentEpLower.includes('đã kết thúc') ||
    statusNameLower.includes('hoàn tất') ||
    statusNameLower.includes('hoàn thành') ||
    statusNameLower.includes('completed') ||
    statusNameLower.includes('end')
  ) {
    isEnded = true;
  }

  const slashMatch = currentEpRaw.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[1] === slashMatch[2]) {
    isEnded = true;
  }

  if (classificationSlug === 'phim-le' && (currentEpLower.includes('full') || !currentEpRaw || currentEpRaw === '1/1' || isEnded)) {
    isEnded = true;
  }

  if (isEnded) {
    statusDisplay = 'Hoàn thành';
  } else if (currentEpRaw) {
    if (/^\d+$/.test(currentEpRaw)) {
      statusDisplay = `Tập ${currentEpRaw}`;
    } else {
      statusDisplay = currentEpRaw;
    }
  } else if (movie?.total_episodes) {
    statusDisplay = `Tập ${movie.total_episodes}`;
  } else {
    const allEps = movie?.episodes?.[0]?.items || [];
    if (allEps.length > 0) {
      const lastEp = allEps[allEps.length - 1];
      statusDisplay = lastEp.name.toLowerCase().startsWith('tập') ? lastEp.name : `Tập ${lastEp.name}`;
    } else {
      statusDisplay = 'Đang cập nhật';
    }
  }

  // Chuẩn bị biến metadata phục vụ SEO (React 19)
  const seoMovieName = movie?.name || 'Xem Phim Online';
  const seoOriginalName = movie?.original_name ? ` (${movie.original_name})` : '';
  const seoEpisodeText = activeEpisode?.name ? ` - Tập ${activeEpisode.name}` : '';
  const seoTitle = `Xem Phim ${seoMovieName}${seoOriginalName}${seoEpisodeText} Full HD Vietsub | Xóm Phim`;
  
  const seoDescription = movie?.description
    ? movie.description.replace(/<[^>]*>?/gm, '').slice(0, 160)
    : `Xem phim ${seoMovieName} trọn bộ phụ đề Tiếng Việt chất lượng cao tại Xóm Phim.`;

  const seoImage = movie?.thumb_url || movie?.poster_url || 'https://xomphim.top/default-poster.jpg';
  const seoUrl = `https://xomphim.top/phim/${movie?.slug || ''}`;

  return (
    <>
      {/* ================= THẺ SEO METADATA TRỰC TIẾP (REACT 19) ================= */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph (Facebook, Zalo, Telegram...) */}
      <meta property="og:type" content="video.movie" />
      <meta property="og:site_name" content="Xóm Phim" />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:alt" content={seoMovieName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      {/* ======================================================================== */}

      <div className="relative w-full pt-16 sm:pt-20 pb-12 sm:pb-16 space-y-4 sm:space-y-8 animate-in fade-in duration-300">
        {/* Cinema Lights Off Dimmer Overlay */}
        {isLightsOff && (
          <div
            onClick={() => setIsLightsOff(false)}
            className="fixed inset-0 bg-black/95 z-40 backdrop-blur-md cursor-pointer transition-opacity duration-300 flex items-start justify-center pt-24"
          >
            <div className="bg-[#181818] text-white px-5 py-2.5 rounded-full border border-white/20 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl">
              <Sun className="w-4 h-4 text-purple-400" />
              Nhấn vào bất kỳ đâu để bật lại đèn giao diện
            </div>
          </div>
        )}

        <div className="w-full max-w-full px-0 lg:px-[40px] space-y-3 sm:space-y-6 box-border">
          {/* Breadcrumb & Navigation Bar */}
          <div className="px-[15px] md:px-[30px] lg:px-0 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <button
              onClick={onBack}
              className="hidden lg:flex items-center gap-2 text-slate-300 hover:text-white font-bold px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>Quay lại trang chủ</span>
            </button>

            <div className="flex items-center gap-2 text-slate-400 overflow-x-auto py-1">
              <span className="text-slate-500">Phim:</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-md">
                {movie.name}
              </span>
              {activeEpisode && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-purple-300 font-bold bg-purple-600/20 px-3 py-0.5 rounded-lg border border-purple-500/40">
                    Tập {activeEpisode.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Video Player Container */}
          <div ref={playerRef} className="relative z-40 w-full transition-all duration-300">
            <div className="relative rounded-none lg:rounded-2xl overflow-hidden bg-black border-y lg:border border-white/15 shadow-2xl">
              {/* Embedded Iframe Player */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                {activeEpisode?.embed ? (
                  <iframe
                    key={`${playerKey}_${activeEpisode.embed}`}
                    src={activeEpisode.embed}
                    title={`${movie.name} - Tập ${activeEpisode.name}`}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  />
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <AlertTriangle className="w-12 h-12 text-pink-500 mx-auto animate-bounce" />
                    <p className="text-white text-sm sm:text-base font-bold">
                      Đang tải hoặc không tìm thấy nguồn phát cho tập này.
                    </p>
                    <button
                      onClick={handleReloadPlayer}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg"
                    >
                      Tải lại trình phát
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Player Control Toolbar */}
              <div className="p-2 sm:p-4 bg-[#0d0d0d] border-t border-white/10 flex items-center justify-between gap-1.5 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={handlePrevEpisode}
                    disabled={currentEpisodeIndex <= 0}
                    className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">Tập trước</span>
                  </button>

                  <button
                    onClick={handleNextEpisode}
                    disabled={currentEpisodeIndex >= episodes.length - 1}
                    className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <span className="whitespace-nowrap">Tập tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    onClick={handleReloadPlayer}
                    title="Tải lại trình phát nếu gặp sự cố"
                    className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Toolbar Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setIsLightsOff(!isLightsOff)}
                    className={`flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl border transition-colors font-semibold cursor-pointer shrink-0 ${
                      isLightsOff
                        ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-transparent'
                    }`}
                    title="Chế độ rạp phim (Tắt đèn)"
                  >
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">Rạp Phim (Tắt Đèn)</span>
                  </button>

                  <button
                    onClick={handleToggleBookmark}
                    className={`flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl border transition-colors font-semibold cursor-pointer shrink-0 ${
                      isSaved
                        ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-transparent'
                    }`}
                    title={isSaved ? 'Đã lưu vào danh sách yêu thích' : 'Lưu phim vào danh sách yêu thích'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : ''}`} />
                    <span className="hidden sm:inline">{isSaved ? 'Đã Yêu Thích' : 'Lưu Yêu Thích'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Server & Episode Selector Card */}
          <div className="glass-panel w-full rounded-none lg:rounded-2xl border-x-0 lg:border border-y lg:border-white/10 p-3.5 sm:p-5 md:p-6 space-y-3 sm:space-y-5">
            {/* Server Switcher */}
            {servers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Chọn Nguồn Phát (Server):</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2.5">
                  {servers.map((server, sIndex) => (
                    <button
                      key={sIndex}
                      onClick={() => handleSelectServer(sIndex)}
                      className={`flex items-center justify-between sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold transition-all min-w-0 ${
                        currentServerIndex === sIndex
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                        <span className="whitespace-nowrap">{server.server_name}</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-slate-300 font-mono shrink-0 ml-0.5">
                        {server.items.length} tập
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Filter & Chunk navigation */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 border-t border-white/10 pt-3 sm:pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                  <Layers className="w-4 h-4 text-pink-400" />
                  <span>Danh Sách Tập Phim ({episodes.length} tập)</span>
                </div>

                {/* Fast episode search */}
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Tìm số tập (VD: 1, 10, 50)..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Chunks Tabs if total episodes > 50 */}
              {totalChunks > 1 && !episodeSearch && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.from({ length: totalChunks }).map((_, cIdx) => {
                    const start = cIdx * CHUNK_SIZE + 1;
                    const end = Math.min((cIdx + 1) * CHUNK_SIZE, episodes.length);
                    return (
                      <button
                        key={cIdx}
                        onClick={() => setActiveChunk(cIdx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeChunk === cIdx
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        Tập {start} - {end}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode Buttons Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {filteredEpisodes.map((ep, idx) => {
                  const originalIndex = episodes.findIndex((e) => e.slug === ep.slug);
                  const isSelected = originalIndex === currentEpisodeIndex;
                  const isWatched = watchedEpisodes[`${movie.slug}_${currentServerIndex}_${originalIndex}`];

                  return (
                    <button
                      key={ep.slug || idx}
                      id={`btn-episode-${ep.slug}`}
                      onClick={() => handleSelectEpisode(originalIndex)}
                      className={`group relative py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-600/40 transform scale-105 z-10'
                          : 'bg-white/5 text-slate-200 hover:bg-white/15 hover:text-white border-white/10'
                      }`}
                    >
                      <span>{ep.name}</span>
                      {isWatched && !isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredEpisodes.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">
                  Không tìm thấy tập nào khớp với &quot;{episodeSearch}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Movie Info & Synopsis Card */}
          <div className="glass-panel w-full rounded-none lg:rounded-2xl border-x-0 lg:border border-y lg:border-white/10 p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* Left / Top: Poster */}
              <div className="w-full lg:w-64 shrink-0 mx-auto lg:mx-0 max-w-[240px] lg:max-w-none">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 aspect-[2/3] w-full bg-[#0d0d0d]">
                  <img
                    src={movie.thumb_url || movie.poster_url}
                    alt={movie.name}
                    className="w-full h-full object-cover object-center rounded-2xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/300x450/181818/ffffff?text=Xóm+Phim';
                    }}
                  />
                </div>
              </div>

              {/* Right / Bottom: Movie Information */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {/* Title & Subtitle */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-heading tracking-tight">
                    {movie.name}
                  </h1>
                  {movie.original_name && (
                    <p className="text-sm sm:text-base text-purple-400 font-semibold mt-1">
                      {movie.original_name}
                    </p>
                  )}
                </div>

                {/* Info Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1 pt-3 border-t border-white/10 text-xs sm:text-sm">
                  {/* Cột 1 */}
                  <div className="space-y-1">
                    {/* 1. Trạng thái */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Tv className="w-3.5 h-3.5" />
                        </div>
                        <span>Trạng thái</span>
                      </div>
                      <div className="text-white font-semibold flex-1 leading-relaxed">
                        {statusDisplay}
                      </div>
                    </div>

                    {/* 2. Đạo diễn */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>Đạo diễn</span>
                      </div>
                      <div className="text-white font-semibold flex-1 break-words leading-relaxed">
                        {movie.director || 'Đang cập nhật'}
                      </div>
                    </div>

                    {/* 3. Phân loại */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                        <span>Phân loại</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectCategory?.('type', classificationSlug, classificationName)}
                          className="text-white font-semibold hover:text-purple-400 transition-colors cursor-pointer hover:underline underline-offset-4 text-left"
                          title={`Xem danh sách ${classificationName}`}
                        >
                          {classificationName}
                        </button>
                      </div>
                    </div>

                    {/* 4. Năm phát hành */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06] lg:border-b-0">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span>Năm phát hành</span>
                      </div>
                      <div className="text-white font-semibold flex-1">
                        {releaseYear || '2025'}
                      </div>
                    </div>
                  </div>

                  {/* Cột 2 */}
                  <div className="space-y-1">
                    {/* 1. Thời lượng */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span>Thời lượng</span>
                      </div>
                      <div className="text-white font-semibold flex-1 leading-relaxed">
                        {movie.time || 'Đang cập nhật'}
                      </div>
                    </div>

                    {/* 2. Diễn viên */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>Diễn viên</span>
                      </div>
                      <div className="text-white font-semibold flex-1 break-words leading-relaxed">
                        {movie.casts || 'Đang cập nhật'}
                      </div>
                    </div>

                    {/* 3. Thể loại */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span>Thể loại</span>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-1.5 flex-1 flex-wrap">
                        {categoriesList.length > 0 ? (
                          categoriesList.map((cat, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onSelectCategory?.('genre', findGenreSlug(cat), cat)}
                              className="text-white font-semibold hover:text-purple-400 transition-colors cursor-pointer hover:underline underline-offset-4 text-left"
                              title={`Xem các phim thuộc thể loại ${cat}`}
                            >
                              {cat}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-400">Đang cập nhật</span>
                        )}
                      </div>
                    </div>

                    {/* 4. Quốc gia */}
                    <div className="flex items-start sm:items-center gap-3 py-2.5">
                      <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 text-slate-400 font-medium">
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <span>Quốc gia</span>
                      </div>
                      <div className="flex-1">
                        {countryName ? (
                          <button
                            type="button"
                            onClick={() => onSelectCategory?.('country', findCountrySlug(countryName), countryName)}
                            className="text-white font-semibold hover:text-purple-400 transition-colors cursor-pointer hover:underline underline-offset-4 text-left"
                            title={`Xem các phim thuộc quốc gia ${countryName}`}
                          >
                            {countryName}
                          </button>
                        ) : (
                          <span className="text-white font-semibold">Châu Á</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synopsis Section */}
                <div className="pt-2 space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                    NỘI DUNG TÓM TẮT:
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {movie.description
                      ? movie.description.replace(/<[^>]*>?/gm, '')
                      : 'Thông tin nội dung phim đang được cập nhật.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Movies */}
        {relatedMovies && relatedMovies.length > 0 && (
          <div className="pt-4 w-full">
            <MovieRow
              title="Phim Đề Xuất Cùng Thể Loại"
              subtitle="Khám phá các bộ phim bom tấn và đặc sắc cùng thể loại có thể bạn sẽ thích"
              icon={<Sparkles className="w-5 h-5 text-purple-400" />}
              movies={relatedMovies}
              onSelectMovie={onSelectMovie}
              onBookmarkChanged={onBookmarkChanged}
            />
          </div>
        )}
      </div>
    </>
  );
};
