import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  Bookmark,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  PlayCircle,
  Tv,
  Clapperboard,
  Compass,
  Globe,
  History,
  Flame,
  ArrowRight,
  Heart,
  Crown,
  Brain,
  Smile,
  Shield,
  Rocket,
  Ghost,
  Atom,
  Wand2,
  Layers,
  Eye,
  GraduationCap,
  Music,
  Users,
  Video,
  Target,
  Trophy,
  Award,
  Check,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRIES, GENRES, MOVIE_TYPES, searchQuickSuggestions } from '../services/api';
import { MovieItem } from '../types/movie';

// Metadata and visual styling for each genre
const GENRE_LIST_DATA: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tagline: string; color: string }
> = {
  'hanh-dong': { icon: Flame, tagline: 'Hành động, gay cấn & kịch tính', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  'tinh-cam': { icon: Heart, tagline: 'Lãng mạn, ngọt ngào, tình yêu', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  'co-trang': { icon: Crown, tagline: 'Kiếm hiệp, cung đấu, lịch sử', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  'tam-ly': { icon: Brain, tagline: 'Sâu sắc, lắng đọng cảm xúc', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  'hai-huoc': { icon: Smile, tagline: 'Vui nhộn, hóm hỉnh, giải trí', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  'vo-thuat': { icon: Shield, tagline: 'Kungfu, võ thuật đỉnh cao', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  'vien-tuong': { icon: Rocket, tagline: 'Sci-Fi, vũ trụ & tương lai', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  'phieu-luu': { icon: Compass, tagline: 'Khám phá, thám hiểm mạo hiểm', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'kinh-di': { icon: Ghost, tagline: 'Rùng rợn, giật gân, hồi hộp', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  'khoa-hoc': { icon: Atom, tagline: 'Khoa học, công nghệ hiện đại', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  'than-thoai': { icon: Wand2, tagline: 'Tiên hiệp, phép thuật huyền bí', color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30' },
  'chinh-kich': { icon: Layers, tagline: 'Kịch tính, đời thực, nhân văn', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  'bi-an': { icon: Eye, tagline: 'Trinh thám, phá án, bí ẩn', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  'hoc-duong': { icon: GraduationCap, tagline: 'Thanh xuân, tuổi trẻ học đường', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  'am-nhac': { icon: Music, tagline: 'Âm nhạc, giai điệu, thần tượng', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  'gia-dinh': { icon: Users, tagline: 'Tình thân, gắn kết gia đình', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'tai-lieu': { icon: Video, tagline: 'Tư liệu, ký sự, đời thực', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  'chien-tranh': { icon: Target, tagline: 'Chiến tranh, lịch sử hào hùng', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  'the-thao': { icon: Trophy, tagline: 'Thể thao, nhiệt huyết thi đấu', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  'kinh-dien': { icon: Award, tagline: 'Tác phẩm bất hủ vượt thời gian', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
};

// Metadata for countries
const COUNTRY_LIST_DATA: Record<
  string,
  { tagline: string; color: string; highlight: string }
> = {
  'trung-quoc': { tagline: 'C-Drama • Hoa Ngữ • Cổ Trang', color: 'text-red-400 bg-red-500/10 border-red-500/30', highlight: 'from-red-600 to-rose-600' },
  'han-quoc': { tagline: 'K-Drama • Hallyu • Tình Cảm', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', highlight: 'from-blue-600 to-cyan-600' },
  'nhat-ban': { tagline: 'Anime • J-Drama • Live Action', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', highlight: 'from-rose-600 to-pink-600' },
  'au-my': { tagline: 'Hollywood • US-UK • Bom Tấn', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', highlight: 'from-indigo-600 to-purple-600' },
  'thai-lan': { tagline: 'T-Drama • Lakorn • Hài Hước', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', highlight: 'from-amber-600 to-orange-600' },
  'viet-nam': { tagline: 'Phim Chiếu Rạp • Điện Ảnh Việt', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', highlight: 'from-yellow-600 to-amber-600' },
  'dai-loan': { tagline: 'Phim Thần Tượng • Tâm Lý', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', highlight: 'from-teal-600 to-emerald-600' },
  'hong-kong': { tagline: 'TVB • Võ Thuật • Kinh Điển', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', highlight: 'from-orange-600 to-red-600' },
  'an-do': { tagline: 'Bollywood • Ca Vũ • Kịch Tính', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', highlight: 'from-purple-600 to-pink-600' },
};

interface NavbarProps {
  currentView: string;
  activeFilter: { type: string; value: string; label: string };
  onNavigateHome: () => void;
  onSelectCategory: (type: 'type' | 'genre' | 'country', value: string, label: string) => void;
  onSearch: (keyword: string) => void;
  onSelectMovie: (slug: string) => void;
  onOpenFavorites: () => void;
  onOpenHistory?: () => void;
  onOpenSourceCode?: () => void;
  favoritesCount: number;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeFilter,
  onNavigateHome,
  onSelectCategory,
  onSearch,
  onSelectMovie,
  onOpenFavorites,
  onOpenHistory,
  favoritesCount,
  historyCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<MovieItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Mobile & Tablet Portrait Drawer / Search states (< 1024px)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Desktop & Landscape Tablet dropdown states (>= 1024px)
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Drawer collapsible sub-sections (Thể loại opens as a clean list by default)
  const [drawerGenreOpen, setDrawerGenreOpen] = useState(true);
  const [drawerCountryOpen, setDrawerCountryOpen] = useState(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Scroll detection for sticky glass header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer or mobile search overlay is active
  useEffect(() => {
    if (isMobileDrawerOpen || isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen, isMobileSearchOpen]);

  // Focus input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  // Handle outside clicks to close desktop dropdowns & suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenreOpen(false);
      }
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live autocomplete search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const items = await searchQuickSuggestions(searchQuery);
        setSuggestions(items.slice(0, 6));
        setShowSuggestions(true);
      } catch (err) {
        console.error('Search suggestion error', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
      setIsMobileDrawerOpen(false);
      onSearch(searchQuery.trim());
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    setIsMobileDrawerOpen(false);
    setSearchQuery('');
    onSelectMovie(slug);
  };

  return (
    <>
      <header
        id="main-header"
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}
        className={`fixed top-0 left-0 right-0 w-full z-[1000] transition-all duration-300 ${
          isScrolled
            ? 'glass-nav py-2 lg:py-2.5 shadow-2xl shadow-black/80'
            : 'bg-gradient-to-b from-black/95 via-black/80 to-transparent py-2.5 lg:py-3.5'
        }`}
      >
        {/* Header container with zero horizontal overflow */}
        <div className="header-container w-full max-w-full px-3.5 sm:px-4 lg:px-4 xl:px-8 box-border">
          <div className="w-full flex items-center justify-between gap-2 lg:gap-2.5 xl:gap-6 flex-nowrap">
            
            {/* LEFT SECTION: Hamburger Button (< 1024px: Mobile & Tablet Portrait) + Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Hamburger Button (< 1024px: lg:hidden) */}
              <button
                id="btn-mobile-hamburger"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-purple-600/30 text-slate-200 hover:text-white border border-white/15 transition-all cursor-pointer shadow-sm"
                aria-label="Mở menu điều hướng"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand Logo XÓM PHIM */}
              <button
                id="brand-logo"
                onClick={() => {
                  onNavigateHome();
                  setIsMobileDrawerOpen(false);
                }}
                className="flex items-center gap-2.5 group text-left cursor-pointer shrink-0 select-none"
              >
                <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-xl overflow-hidden bg-black p-0.5 shadow-lg shadow-purple-600/30 border border-purple-500/40 group-hover:border-pink-500/60 group-hover:shadow-pink-500/40 group-hover:scale-105 transition-all duration-200 shrink-0">
                  <img
                    src="/logo.jpg"
                    alt="Logo Xóm Phim"
                    className="w-full h-full object-cover rounded-[8px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-black text-lg sm:text-xl xl:text-2xl tracking-wider text-white leading-tight">
                    XÓM <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">PHIM</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 hidden xl:block tracking-wide leading-none mt-0.5">
                    Cả xóm cùng xem phim
                  </span>
                </div>
              </button>
            </div>

            {/* CENTER NAVIGATION LINKS (Visible ONLY on Landscape Tablet & Desktop: >= 1024px, hidden on < 1024px) */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 text-[12px] lg:text-[12.5px] xl:text-sm font-bold flex-1 justify-center max-w-fit">
              {/* Trang Chủ */}
              <button
                id="nav-home"
                onClick={onNavigateHome}
                className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'home' && !activeFilter.value
                    ? 'text-white bg-purple-600 shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Trang Chủ
              </button>

              {/* Movie Types */}
              {MOVIE_TYPES.filter((type) => type.slug !== 'phim-moi-cap-nhat').map((type) => (
                <button
                  key={type.slug}
                  id={`nav-type-${type.slug}`}
                  onClick={() => onSelectCategory('type', type.slug, type.name)}
                  className={`px-1.5 xl:px-2.5 py-1.5 xl:py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter.type === 'type' && activeFilter.value === type.slug
                      ? 'text-white bg-purple-600 shadow-md shadow-purple-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {type.name}
                </button>
              ))}

              {/* Thể Loại Dropdown */}
              <div className="relative" ref={genreDropdownRef}>
                <button
                  id="nav-genre-dropdown-btn"
                  onClick={() => {
                    setIsGenreOpen(!isGenreOpen);
                    setIsCountryOpen(false);
                  }}
                  className={`flex items-center gap-0.5 xl:gap-1 px-1.5 xl:px-2.5 py-1.5 xl:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter.type === 'genre'
                      ? 'text-white bg-purple-600 shadow-md shadow-purple-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>Thể Loại</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGenreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGenreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[460px] max-h-[460px] overflow-y-auto custom-scrollbar glass-panel rounded-2xl shadow-2xl p-3 z-50 border border-white/15 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-1.5 text-xs font-bold text-slate-300 border-b border-white/10 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-purple-400" />
                        <span>Danh Sách Thể Loại Phim ({GENRES.length})</span>
                      </div>
                      <span className="text-[10.5px] text-purple-300 font-medium">Khám phá theo chủ đề</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GENRES.map((g) => {
                        const info = GENRE_LIST_DATA[g.slug] || {
                          icon: Film,
                          tagline: 'Khám phá phim hay',
                          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                        };
                        const IconComp = info.icon;
                        const isSelected = activeFilter.type === 'genre' && activeFilter.value === g.slug;
                        return (
                          <button
                            key={g.slug}
                            onClick={() => {
                              onSelectCategory('genre', g.slug, g.name);
                              setIsGenreOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-600/30'
                                : 'bg-white/[0.03] hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-white/20 border-white/30 text-white'
                                    : info.color
                                }`}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate group-hover:text-purple-300">
                                  {g.name}
                                </p>
                                <p
                                  className={`text-[9px] truncate ${
                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  {info.tagline}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 ml-1">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quốc Gia Dropdown */}
              <div className="relative" ref={countryDropdownRef}>
                <button
                  id="nav-country-dropdown-btn"
                  onClick={() => {
                    setIsCountryOpen(!isCountryOpen);
                    setIsGenreOpen(false);
                  }}
                  className={`flex items-center gap-0.5 xl:gap-1 px-1.5 xl:px-2.5 py-1.5 xl:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter.type === 'country'
                      ? 'text-white bg-purple-600 shadow-md shadow-purple-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>Quốc Gia</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCountryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCountryOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 max-h-[460px] overflow-y-auto custom-scrollbar glass-panel rounded-2xl shadow-2xl p-3 z-50 border border-white/15 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-1.5 text-xs font-bold text-slate-300 border-b border-white/10 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Quốc Gia Sản Xuất ({COUNTRIES.length})</span>
                      </div>
                      <span className="text-[10.5px] text-blue-300 font-medium">Toàn cầu</span>
                    </div>
                    <div className="space-y-1">
                      {COUNTRIES.map((c) => {
                        const info = COUNTRY_LIST_DATA[c.slug] || {
                          tagline: 'Điện ảnh đặc sắc',
                          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                          highlight: 'from-blue-600 to-indigo-600',
                        };
                        const isSelected = activeFilter.type === 'country' && activeFilter.value === c.slug;
                        return (
                          <button
                            key={c.slug}
                            onClick={() => {
                              onSelectCategory('country', c.slug, c.name);
                              setIsCountryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30'
                                : 'bg-white/[0.03] hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-white/20 border-white/30 text-white'
                                    : info.color
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate group-hover:text-blue-300">
                                  {c.name}
                                </p>
                                <p
                                  className={`text-[9.5px] truncate ${
                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  {info.tagline}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 ml-1">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* RIGHT SECTION: Search + Bookmark (Always 100% visible on right edge without overflow) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
              
              {/* Inline Search Bar (Visible on Landscape Tablet & Desktop: >= 1024px) */}
              <div className="hidden lg:block relative shrink-0" ref={searchContainerRef}>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Tìm phim..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="w-[125px] lg:w-[140px] xl:w-[220px] bg-white/10 border border-white/15 focus:border-purple-500 rounded-full pl-7 xl:pl-8 pr-6 xl:pr-7 py-1.5 xl:py-2 text-xs xl:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 focus:bg-black/90 focus:ring-2 focus:ring-purple-500/40 focus:w-[170px] lg:focus:w-[185px] xl:focus:w-[260px] font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Autocomplete suggestions box */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-72 lg:w-80 xl:w-96 glass-panel rounded-2xl shadow-2xl p-2.5 z-50 border border-white/15 overflow-hidden">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-white/10">
                      <span>Gợi ý tìm kiếm</span>
                      {isSearching && <span className="text-purple-400 animate-pulse text-[10px]">Đang tìm...</span>}
                    </div>
                    <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                      {suggestions.map((item) => (
                        <button
                          key={item.slug}
                          onClick={() => handleSuggestionClick(item.slug)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition-colors text-left group cursor-pointer"
                        >
                          <img
                            src={item.thumb_url || item.poster_url}
                            alt={item.name}
                            className="w-9 h-12 object-cover rounded-lg shrink-0 bg-slate-900"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/100x140/181818/ffffff?text=Xóm+Phim';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-purple-400 truncate">
                              {item.name}
                            </h4>
                            <p className="text-[10.5px] text-slate-400 truncate">
                              {item.original_name || 'Full HD'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                                {item.current_episode || item.quality || 'HD'}
                              </span>
                              <span className="text-[9.5px] text-slate-400">{item.time || ''}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full mt-2 py-1.5 text-center text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-600/30 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Xem tất cả kết quả cho &quot;{searchQuery}&quot;
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile & Tablet Portrait Search Icon Button (< 1024px: lg:hidden) */}
              <button
                id="btn-mobile-search-toggle"
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-purple-600/30 text-slate-200 hover:text-white border border-white/15 transition-all cursor-pointer shrink-0 shadow-sm"
                aria-label="Tìm kiếm phim"
                title="Tìm kiếm"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Bookmark / Saved Movies Icon Button (ALWAYS clearly visible on right edge without overflow) */}
              <button
                id="btn-favorites"
                onClick={onOpenFavorites}
                title="Phim Đã Lưu"
                aria-label="Phim Đã Lưu"
                className="relative flex items-center justify-center w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-pink-600/30 text-slate-200 hover:text-pink-400 border border-white/15 hover:border-pink-500/30 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Bookmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[9.5px] sm:text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN SEARCH OVERLAY (< 1024px: Mobile & Tablet Portrait) */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6"
          >
            {/* Search Top Bar */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/15">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-purple-400 absolute left-3 pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Nhập tên phim, diễn viên, đạo diễn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit();
                  }}
                  className="w-full bg-white/10 border border-white/20 focus:border-purple-500 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-400 outline-none focus:bg-white/15 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-3.5 py-3 rounded-2xl bg-white/10 text-slate-300 hover:text-white text-sm font-bold border border-white/10 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Quick Action when hitting Enter */}
            {searchQuery.trim() && (
              <button
                onClick={() => handleSearchSubmit()}
                className="mt-3 flex items-center justify-between p-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">Tìm kiếm tất cả kết quả cho: &quot;{searchQuery}&quot;</span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-300 shrink-0" />
              </button>
            )}

            {/* Search Suggestions List */}
            <div className="flex-1 overflow-y-auto mt-3 divide-y divide-white/5">
              {isSearching && (
                <div className="py-6 text-center text-xs text-purple-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tìm kiếm phim tương ứng...</span>
                </div>
              )}

              {!isSearching && suggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1">
                    Gợi ý nhanh
                  </p>
                  {suggestions.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => handleSuggestionClick(item.slug)}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-left group cursor-pointer"
                    >
                      <img
                        src={item.thumb_url || item.poster_url}
                        alt={item.name}
                        className="w-12 h-16 object-cover rounded-xl shrink-0 bg-slate-900 shadow-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/100x140/181818/ffffff?text=Xóm+Phim';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-400 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {item.original_name || 'Full HD'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                            {item.current_episode || item.quality || 'HD'}
                          </span>
                          {item.time && (
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery.length >= 2 && suggestions.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Không tìm thấy gợi ý nhanh. Bấm <span className="text-purple-400 font-bold">Tìm kiếm</span> để quét toàn bộ thư viện phim.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HAMBURGER SIDE DRAWER (< 1024px: Mobile & Tablet Portrait) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm lg:hidden"
            />

            {/* Side Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-[1110] w-[80vw] max-w-[340px] bg-[#0c0c10] border-r border-white/15 shadow-2xl flex flex-col lg:hidden overflow-hidden"
            >
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-black p-0.5 shadow-md border border-purple-500/40 shrink-0 flex items-center justify-center">
                    <img
                      src="/logo.jpg"
                      alt="Logo Xóm Phim"
                      className="w-full h-full object-cover rounded-[8px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-heading font-black text-lg text-white">
                    XÓM <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">PHIM</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* 1. Quick Access: Saved & History */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenFavorites();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-pink-400" />
                    <span>Yêu thích ({favoritesCount})</span>
                  </button>

                  {onOpenHistory && (
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onOpenHistory();
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <History className="w-4 h-4 text-purple-400" />
                      <span>Lịch sử ({historyCount})</span>
                    </button>
                  )}
                </div>

                {/* 2. Main Categories (Trang Chủ, Phim Bộ, Phim Lẻ, Hoạt Hình & Anime, TV Shows) */}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Danh Mục Chính
                  </p>

                  {/* Trang Chủ */}
                  <button
                    onClick={() => {
                      onNavigateHome();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      currentView === 'home' && !activeFilter.value
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4 text-purple-400" />
                    <span>Trang Chủ</span>
                  </button>

                  {/* Phim Bộ */}
                  <button
                    onClick={() => {
                      onSelectCategory('type', 'phim-bo', 'Phim Bộ');
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeFilter.value === 'phim-bo'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Tv className="w-4 h-4 text-purple-400" />
                    <span>Phim Bộ</span>
                  </button>

                  {/* Phim Lẻ */}
                  <button
                    onClick={() => {
                      onSelectCategory('type', 'phim-le', 'Phim Lẻ');
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeFilter.value === 'phim-le'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Clapperboard className="w-4 h-4 text-pink-400" />
                    <span>Phim Lẻ</span>
                  </button>

                  {/* Hoạt Hình & Anime */}
                  <button
                    onClick={() => {
                      onSelectCategory('type', 'hoat-hinh', 'Hoạt Hình & Anime');
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeFilter.value === 'hoat-hinh'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Hoạt Hình & Anime</span>
                  </button>

                  {/* TV Shows */}
                  <button
                    onClick={() => {
                      onSelectCategory('type', 'tv-shows', 'TV Shows');
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeFilter.value === 'tv-shows'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>TV Shows</span>
                  </button>
                </div>

                {/* 3. Khám phá Thể Loại (Dạng Danh Sách Chi Tiết) */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => setDrawerGenreOpen(!drawerGenreOpen)}
                    className="w-full flex items-center justify-between px-2 py-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-400" />
                      <span>Thể Loại Phim ({GENRES.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                      <span>{drawerGenreOpen ? 'Thu gọn' : 'Xem danh sách'}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          drawerGenreOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {drawerGenreOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1.5 overflow-hidden"
                      >
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-1.5 space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar">
                          {GENRES.map((g) => {
                            const info = GENRE_LIST_DATA[g.slug] || {
                              icon: Film,
                              tagline: 'Khám phá phim hay',
                              color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                            };
                            const IconComp = info.icon;
                            const isSelected =
                              activeFilter.type === 'genre' && activeFilter.value === g.slug;
                            return (
                              <button
                                key={g.slug}
                                onClick={() => {
                                  onSelectCategory('genre', g.slug, g.name);
                                  setIsMobileDrawerOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-left ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-600/30'
                                    : 'bg-white/[0.03] hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                      isSelected
                                        ? 'bg-white/20 border-white/30 text-white'
                                        : info.color
                                    }`}
                                  >
                                    <IconComp className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold truncate group-hover:text-purple-300">
                                      {g.name}
                                    </p>
                                    <p
                                      className={`text-[10px] truncate ${
                                        isSelected ? 'text-white/80' : 'text-slate-400'
                                      }`}
                                    >
                                      {info.tagline}
                                    </p>
                                  </div>
                                </div>
                                <div className="shrink-0 ml-2">
                                  {isSelected ? (
                                    <span className="w-5 h-5 rounded-full bg-white text-purple-700 flex items-center justify-center shadow-sm">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Khám phá Quốc Gia (Dạng Danh Sách Chi Tiết) */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => setDrawerCountryOpen(!drawerCountryOpen)}
                    className="w-full flex items-center justify-between px-2 py-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span>Quốc Gia Sản Xuất ({COUNTRIES.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
                      <span>{drawerCountryOpen ? 'Thu gọn' : 'Xem danh sách'}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          drawerCountryOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {drawerCountryOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1.5 overflow-hidden"
                      >
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-1.5 space-y-1 max-h-[340px] overflow-y-auto custom-scrollbar">
                          {COUNTRIES.map((c) => {
                            const info = COUNTRY_LIST_DATA[c.slug] || {
                              tagline: 'Điện ảnh đặc sắc',
                              color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                              highlight: 'from-blue-600 to-indigo-600',
                            };
                            const isSelected =
                              activeFilter.type === 'country' && activeFilter.value === c.slug;
                            return (
                              <button
                                key={c.slug}
                                onClick={() => {
                                  onSelectCategory('country', c.slug, c.name);
                                  setIsMobileDrawerOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-left ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30'
                                    : 'bg-white/[0.03] hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                      isSelected
                                        ? 'bg-white/20 border-white/30 text-white'
                                        : info.color
                                    }`}
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold truncate group-hover:text-blue-300">
                                      {c.name}
                                    </p>
                                    <p
                                      className={`text-[10px] truncate ${
                                        isSelected ? 'text-white/80' : 'text-slate-400'
                                      }`}
                                    >
                                      {info.tagline}
                                    </p>
                                  </div>
                                </div>
                                <div className="shrink-0 ml-2">
                                  {isSelected ? (
                                    <span className="w-5 h-5 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-sm">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-white/10 bg-black/60 text-center">
                <p className="text-[11px] text-slate-500">
                  Xóm Phim • Trải nghiệm xem phim sắc nét
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
