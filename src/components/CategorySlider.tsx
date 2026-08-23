import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Heart,
  Crown,
  Rocket,
  Brain,
  Smile,
  Shield,
  Ghost,
  Compass,
  Wand2,
  GraduationCap,
  Users,
  Music,
  Video,
  Target,
  Trophy,
  Atom,
  Eye,
  Film,
  Award,
  Layers,
} from 'lucide-react';
import { GENRES } from '../services/api';

interface CategorySliderProps {
  title?: string;
  subtitle?: string;
  onSelectGenre: (slug: string, name: string) => void;
}

// Cấu hình Gradient bắt mắt và Icon đại diện cho từng thể loại phim
const GENRE_STYLES: Record<
  string,
  {
    gradient: string;
    border: string;
    shadow: string;
    icon: React.ReactNode;
    tagline: string;
  }
> = {
  'hanh-dong': {
    gradient: 'from-rose-600 via-red-600 to-amber-600',
    border: 'border-red-500/40 hover:border-red-400',
    shadow: 'hover:shadow-red-500/30',
    icon: <Flame className="w-6 h-6 text-amber-200" />,
    tagline: 'Gay Cấn & Mãn Nhãn',
  },
  'tinh-cam': {
    gradient: 'from-pink-600 via-rose-500 to-red-500',
    border: 'border-pink-500/40 hover:border-pink-400',
    shadow: 'hover:shadow-pink-500/30',
    icon: <Heart className="w-6 h-6 text-pink-200" />,
    tagline: 'Lãng Mạn & Ngọt Ngào',
  },
  'co-trang': {
    gradient: 'from-amber-600 via-orange-600 to-yellow-700',
    border: 'border-amber-500/40 hover:border-amber-400',
    shadow: 'hover:shadow-amber-500/30',
    icon: <Crown className="w-6 h-6 text-yellow-200" />,
    tagline: 'Kiếm Hiệp & Cung Đình',
  },
  'vien-tuong': {
    gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    shadow: 'hover:shadow-cyan-500/30',
    icon: <Rocket className="w-6 h-6 text-cyan-200" />,
    tagline: 'Vũ Trụ & Tương Lai',
  },
  'tam-ly': {
    gradient: 'from-purple-700 via-indigo-600 to-pink-600',
    border: 'border-purple-500/40 hover:border-purple-400',
    shadow: 'hover:shadow-purple-500/30',
    icon: <Brain className="w-6 h-6 text-purple-200" />,
    tagline: 'Sâu Sắc & Cảm Xúc',
  },
  'hai-huoc': {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    border: 'border-amber-400/40 hover:border-amber-300',
    shadow: 'hover:shadow-amber-500/30',
    icon: <Smile className="w-6 h-6 text-white" />,
    tagline: 'Giải Trí & Hóm Hỉnh',
  },
  'vo-thuat': {
    gradient: 'from-red-600 via-orange-600 to-amber-700',
    border: 'border-red-500/40 hover:border-red-400',
    shadow: 'hover:shadow-red-500/30',
    icon: <Shield className="w-6 h-6 text-amber-200" />,
    tagline: 'Quyền Thuật Đỉnh Cao',
  },
  'phieu-luu': {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    shadow: 'hover:shadow-emerald-500/30',
    icon: <Compass className="w-6 h-6 text-emerald-200" />,
    tagline: 'Thám Hiểm & Kịch Tính',
  },
  'kinh-di': {
    gradient: 'from-purple-950 via-slate-900 to-red-950',
    border: 'border-red-600/40 hover:border-red-500',
    shadow: 'hover:shadow-red-600/30',
    icon: <Ghost className="w-6 h-6 text-red-300" />,
    tagline: 'Rùng Rợn & Ám Ảnh',
  },
  'than-thoai': {
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-700',
    border: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    shadow: 'hover:shadow-fuchsia-500/30',
    icon: <Wand2 className="w-6 h-6 text-fuchsia-200" />,
    tagline: 'Huyền Bí & Tiên Hiệp',
  },
  'hoc-duong': {
    gradient: 'from-blue-600 via-sky-500 to-teal-500',
    border: 'border-blue-400/40 hover:border-blue-300',
    shadow: 'hover:shadow-blue-500/30',
    icon: <GraduationCap className="w-6 h-6 text-sky-200" />,
    tagline: 'Thanh Xuân Vườn Trường',
  },
  'gia-dinh': {
    gradient: 'from-teal-600 via-emerald-600 to-green-600',
    border: 'border-teal-500/40 hover:border-teal-400',
    shadow: 'hover:shadow-teal-500/30',
    icon: <Users className="w-6 h-6 text-teal-200" />,
    tagline: 'Ấm Áp & Ý Nghĩa',
  },
  'am-nhac': {
    gradient: 'from-violet-600 via-fuchsia-600 to-pink-600',
    border: 'border-violet-500/40 hover:border-violet-400',
    shadow: 'hover:shadow-violet-500/30',
    icon: <Music className="w-6 h-6 text-violet-200" />,
    tagline: 'Giai Điệu & Nghệ Thuật',
  },
  'tai-lieu': {
    gradient: 'from-slate-700 via-zinc-800 to-neutral-900',
    border: 'border-slate-500/40 hover:border-slate-400',
    shadow: 'hover:shadow-slate-500/30',
    icon: <Video className="w-6 h-6 text-slate-200" />,
    tagline: 'Thực Tế & Tri Thức',
  },
  'chien-tranh': {
    gradient: 'from-stone-700 via-amber-900 to-stone-900',
    border: 'border-amber-600/40 hover:border-amber-500',
    shadow: 'hover:shadow-amber-600/30',
    icon: <Target className="w-6 h-6 text-amber-200" />,
    tagline: 'Lịch Sử & Hào Hùng',
  },
  'the-thao': {
    gradient: 'from-orange-600 via-amber-600 to-red-600',
    border: 'border-orange-500/40 hover:border-orange-400',
    shadow: 'hover:shadow-orange-500/30',
    icon: <Trophy className="w-6 h-6 text-yellow-200" />,
    tagline: 'Nhiệt Huyết Đam Mê',
  },
  'khoa-hoc': {
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    shadow: 'hover:shadow-cyan-500/30',
    icon: <Atom className="w-6 h-6 text-cyan-200" />,
    tagline: 'Khám Phá Vũ Trụ',
  },
  'bi-an': {
    gradient: 'from-purple-900 via-indigo-900 to-slate-900',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    shadow: 'hover:shadow-indigo-500/30',
    icon: <Eye className="w-6 h-6 text-indigo-200" />,
    tagline: 'Trinh Thám & Giải Mã',
  },
  'chinh-kich': {
    gradient: 'from-rose-800 via-purple-900 to-slate-900',
    border: 'border-rose-600/40 hover:border-rose-500',
    shadow: 'hover:shadow-rose-600/30',
    icon: <Film className="w-6 h-6 text-rose-200" />,
    tagline: 'Kịch Tính Đỉnh Cao',
  },
  'kinh-dien': {
    gradient: 'from-amber-700 via-yellow-800 to-neutral-900',
    border: 'border-yellow-600/40 hover:border-yellow-500',
    shadow: 'hover:shadow-yellow-600/30',
    icon: <Award className="w-6 h-6 text-yellow-200" />,
    tagline: 'Tác Phẩm Bất Hủ',
  },
};

const DEFAULT_STYLE = {
  gradient: 'from-purple-600 via-indigo-600 to-blue-600',
  border: 'border-purple-500/40 hover:border-purple-400',
  shadow: 'hover:shadow-purple-500/30',
  icon: <Sparkles className="w-6 h-6 text-purple-200" />,
  tagline: 'Khám Phá Ngay',
};

export const CategorySlider: React.FC<CategorySliderProps> = ({
  title = 'Tất Cả Danh Mục Phim',
  subtitle = 'Khám phá hàng nghìn bộ phim đặc sắc theo từng thể loại yêu thích',
  onSelectGenre,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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
  }, []);

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
    <section className="relative w-full py-6 sm:py-8 group/category-slider">
      {/* Section Header */}
      <div className="flex items-center justify-between px-[15px] md:px-[40px] mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide font-heading">
                {title}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                {GENRES.length} Thể loại
              </span>
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Slider with Smooth Scroll and Hidden Scrollbar */}
      <div className="relative w-full px-[15px] md:px-[40px]">
        {/* Left Scroll Button - Glowing Floating Netflix Button */}
        <button
          onClick={() => handleScroll('left')}
          className={`slider-nav-btn left ${
            showLeftArrow
              ? 'opacity-95 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Cuộn danh mục sang trái"
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
          aria-label="Cuộn danh mục sang phải"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
        </button>

        {/* Genre Cards Row - Gradient Cards with Big Centered Typography */}
        <div
          ref={rowRef}
          className="flex items-stretch gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth no-scrollbar horizontal-slider py-3"
          style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        >
          {GENRES.map((genre) => {
            const style = GENRE_STYLES[genre.slug] || DEFAULT_STYLE;
            return (
              <div
                key={genre.slug}
                onClick={() => onSelectGenre(genre.slug, genre.name)}
                className={`flex-shrink-0 w-44 sm:w-52 md:w-60 h-32 sm:h-36 relative rounded-2xl overflow-hidden cursor-pointer select-none border transition-all duration-300 transform hover:scale-[1.05] hover:-translate-y-1 shadow-lg hover:shadow-2xl ${style.border} ${style.shadow} group`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Background Vibrant Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Subtle Geometric Overlay Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Content: Centered Big Typography & Icon */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm mb-2 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {style.icon}
                  </div>

                  <h3 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-white tracking-wide uppercase drop-shadow-md text-center leading-tight">
                    {genre.name}
                  </h3>

                  <span className="text-[11px] font-semibold text-white/85 mt-1 tracking-wider drop-shadow-sm group-hover:text-white transition-colors">
                    {style.tagline}
                  </span>
                </div>

                {/* Bottom Active Glow Bar on Hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 group-hover:bg-white transition-colors duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
