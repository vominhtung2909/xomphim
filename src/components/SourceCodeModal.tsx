import React, { useState } from 'react';
import { Code2, Copy, Check, X, Download, FileCode, ExternalLink, Terminal } from 'lucide-react';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'guide'>('html');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const htmlCode = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xóm Phim - Cả Xóm Cùng Xem Phim | Xem Phim HD Miễn Phí</title>
  <!-- Google Fonts: Nunito & Quicksand -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- Overlay Tắt Đèn Rạp Chiếu -->
  <div id="lights-overlay" class="lights-overlay hidden">
    <div class="lights-hint"><i class="fa-solid fa-sun"></i> Nhấn vào bất kỳ đâu để bật lại đèn</div>
  </div>

  <!-- Header Điều Hướng (Sticky + Glassmorphism) -->
  <header id="header" class="header">
    <div class="container header-container">
      <!-- Logo Xóm Phim -->
      <a href="#" id="logo-btn" class="logo">
        <div class="logo-icon">
          <i class="fa-solid fa-play"></i>
        </div>
        <div class="logo-text">
          <span>XÓM <span class="highlight">PHIM</span></span>
        </div>
      </a>

      <!-- Menu Điều Hướng Desktop -->
      <nav class="nav-menu">
        <button class="nav-link active" data-type="phim-moi-cap-nhat">Trang Chủ</button>
        <button class="nav-link" data-type="phim-bo">Phim Bộ</button>
        <button class="nav-link" data-type="phim-le">Phim Lẻ</button>
        <button class="nav-link" data-type="hoat-hinh">Hoạt Hình</button>
        <button class="nav-link" data-type="tv-shows">TV Shows</button>
        
        <!-- Dropdown Thể Loại -->
        <div class="dropdown">
          <button class="dropdown-toggle">
            Thể Loại <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="dropdown-menu" id="genre-dropdown-menu"></div>
        </div>

        <!-- Dropdown Quốc Gia -->
        <div class="dropdown">
          <button class="dropdown-toggle">
            Quốc Gia <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="dropdown-menu" id="country-dropdown-menu"></div>
        </div>
      </nav>

      <!-- Thanh Tìm Kiếm & Nút Tiện Ích -->
      <div class="header-actions">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" id="search-input" placeholder="Tìm phim, diễn viên..." />
          <button id="search-clear" class="search-clear hidden"><i class="fa-solid fa-xmark"></i></button>
          <div id="search-suggestions" class="search-suggestions hidden"></div>
        </div>

        <button id="btn-open-bookmarks" class="icon-btn" title="Phim Yêu Thích">
          <i class="fa-solid fa-bookmark"></i>
          <span id="bookmark-badge" class="badge-count hidden">0</span>
        </button>

        <button id="btn-open-history" class="icon-btn" title="Lịch Sử Xem">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span id="history-badge" class="badge-count hidden">0</span>
        </button>

        <button id="btn-mobile-toggle" class="mobile-toggle-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Menu -->
    <div id="mobile-menu" class="mobile-menu hidden">
      <div class="mobile-nav-grid">
        <button class="mobile-nav-btn" data-type="phim-moi-cap-nhat"><i class="fa-solid fa-house"></i> Trang Chủ</button>
        <button class="mobile-nav-btn" data-type="phim-bo"><i class="fa-solid fa-tv"></i> Phim Bộ</button>
        <button class="mobile-nav-btn" data-type="phim-le"><i class="fa-solid fa-clapperboard"></i> Phim Lẻ</button>
        <button class="mobile-nav-btn" data-type="hoat-hinh"><i class="fa-solid fa-dragon"></i> Hoạt Hình</button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <!-- View 1: Trang Danh Sách Phim -->
    <div id="home-view" class="view-section">
      <section id="hero-banner" class="hero-banner"></section>

      <div class="container main-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="title-bar"></span>
            <h2 id="section-title" class="section-title">Phim Mới Cập Nhật</h2>
          </div>
        </div>

        <div id="movie-grid" class="movie-grid"></div>
        <div id="pagination" class="pagination"></div>
      </div>
    </div>

    <!-- View 2: Trang Xem Phim (SPA) -->
    <div id="watch-view" class="view-section hidden">
      <div class="container watch-container">
        <div class="watch-nav">
          <button id="btn-back-home" class="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Quay lại danh sách
          </button>
          <div id="watch-breadcrumb" class="breadcrumb"></div>
        </div>

        <div class="player-wrapper">
          <div class="player-aspect">
            <iframe id="video-player" src="" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
          </div>

          <div class="player-toolbar">
            <div class="toolbar-left">
              <button id="btn-prev-ep" class="ctrl-btn"><i class="fa-solid fa-backward-step"></i> Tập trước</button>
              <button id="btn-next-ep" class="ctrl-btn">Tập tiếp <i class="fa-solid fa-forward-step"></i></button>
              <button id="btn-reload-player" class="ctrl-btn" title="Tải lại Player"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
            <div class="toolbar-right">
              <button id="btn-toggle-lights" class="ctrl-btn"><i class="fa-solid fa-moon"></i> Tắt đèn</button>
              <button id="btn-toggle-theater" class="ctrl-btn"><i class="fa-solid fa-expand"></i> Rạp chiếu</button>
            </div>
          </div>
        </div>

        <div class="episodes-panel glass-box">
          <div class="panel-section">
            <div class="panel-title"><i class="fa-solid fa-server"></i> Chọn Nguồn Phát (Server):</div>
            <div id="server-list" class="server-buttons"></div>
          </div>

          <div class="panel-section">
            <div class="panel-header-flex">
              <div class="panel-title"><i class="fa-solid fa-layer-group"></i> Danh Sách Tập Phim:</div>
              <input type="text" id="episode-search-input" placeholder="Tìm nhanh số tập..." class="ep-search-input" />
            </div>
            <div id="episode-list" class="episode-grid"></div>
          </div>
        </div>

        <div id="movie-detail-info" class="movie-info-panel glass-box"></div>
      </div>
    </div>
  </main>

  <!-- Modal Yêu Thích & Lịch Sử -->
  <div id="bookmarks-modal" class="modal-overlay hidden">
    <div class="modal-content glass-box">
      <div class="modal-header">
        <div class="modal-tabs">
          <button id="tab-fav" class="modal-tab active"><i class="fa-solid fa-bookmark"></i> Phim Yêu Thích</button>
          <button id="tab-hist" class="modal-tab"><i class="fa-solid fa-clock-rotate-left"></i> Lịch Sử Xem</button>
        </div>
        <button id="btn-close-modal" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="modal-body" class="modal-body"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`;

  const cssCode = `/* ==========================================================================
   XÓM PHIM - CSS STYLING (DARK MODE / NETFLIX & CYBERPUNK)
   ========================================================================== */

:root {
  --bg-dark: #0a0a0c;
  --bg-surface: #121216;
  --bg-card: #16161c;
  --bg-glass: rgba(18, 18, 24, 0.85);
  
  --primary: #9333ea;
  --primary-hover: #7e22ce;
  --primary-glow: rgba(147, 51, 234, 0.4);
  --gradient-primary: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%);
  --cyan: #06b6d4;
  
  --text-white: #ffffff;
  --text-light: #f1f5f9;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --border-light: rgba(255, 255, 255, 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Be Vietnam Pro', sans-serif; background: var(--bg-dark); color: var(--text-light); }
.container { width: 100%; max-width: 100vw; margin: 0 auto; padding: 0 1.5rem; }
.hidden { display: none !important; }
.glass-box { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border-light); border-radius: var(--radius-lg); }

/* Header */
.header { position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 1000; background: rgba(10, 10, 12, 0.95); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-light); }
.header-container { display: flex; align-items: center; justify-content: space-between; height: 70px; }
.logo { display: flex; align-items: center; gap: 0.6rem; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 1.4rem; text-decoration: none; color: #fff; }
.logo-icon { width: 38px; height: 38px; background: var(--gradient-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: #fff; }
.highlight { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Main & Hero Banner */
main, .hero-content { position: relative; z-index: 1; }
.hero-section { position: relative; padding-top: 100px !important; padding-bottom: 20px !important; margin-bottom: 0px !important; min-height: auto !important; }
.hero-content-inner { padding-top: 0px !important; padding-bottom: 20px !important; }
.hero-poster-container { width: 300px; max-width: 25vw; height: auto; aspect-ratio: 2 / 3; position: relative; }
.hero-poster-container img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); }
.movie-sections, .category-section { margin-top: 12px !important; padding-top: 8px !important; }

/* Netflix Horizontal Row Slider (5 Cards Fixed on Desktop) */
.movie-slider { display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth; width: 100%; }
.movie-slider-card { flex: 0 0 calc((100% - 64px) / 5); min-width: calc((100% - 64px) / 5); max-width: calc((100% - 64px) / 5); }
@media (max-width: 1099px) { .movie-slider-card { flex: 0 0 calc((100% - 48px) / 4); min-width: calc((100% - 48px) / 4); max-width: calc((100% - 48px) / 4); } }
@media (max-width: 859px) { .movie-slider-card { flex: 0 0 calc((100% - 32px) / 3); min-width: calc((100% - 32px) / 3); max-width: calc((100% - 32px) / 3); } }
@media (max-width: 639px) { .movie-slider-card { flex: 0 0 calc((100% - 12px) / 2); min-width: calc((100% - 12px) / 2); max-width: calc((100% - 12px) / 2); } }

/* Netflix Style Floating Navigation Buttons */
.slider-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 40; width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(10,10,15,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.25); color: #fff; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,0.8); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0.95; }
.slider-nav-btn:hover { opacity: 1; transform: translateY(-50%) scale(1.14); background: linear-gradient(135deg, #9333ea, #ec4899); border-color: rgba(255,255,255,0.7); box-shadow: 0 0 25px rgba(168,85,247,0.8); }
.slider-nav-btn.left { left: 10px; }
.slider-nav-btn.right { right: 10px; }

/* Grid */
.movie-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 2.5rem; }
@media (min-width: 640px) { .movie-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) { .movie-grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1100px) { .movie-grid { grid-template-columns: repeat(5, 1fr); } }
@media (min-width: 1400px) { .movie-grid { grid-template-columns: repeat(6, 1fr); } }

/* Cards */
.movie-card { position: relative; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.movie-card:hover { transform: translateY(-8px) scale(1.03); border-color: rgba(147, 51, 234, 0.8); box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 25px var(--primary-glow); }
.card-poster { position: relative; width: 100%; aspect-ratio: 2/3; overflow: hidden; background: #121624; }
.card-poster img { width: 100%; height: 100%; object-fit: cover; }
.card-badge-top { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
.card-info { padding: 0.85rem; }
.card-title { font-size: 0.95rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Player */
.player-wrapper { position: relative; background: #000; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-light); box-shadow: 0 25px 60px rgba(0,0,0,0.9); margin-bottom: 1.5rem; }
.player-aspect { position: relative; width: 100%; aspect-ratio: 16/9; }
.player-aspect iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.ep-btn { padding: 0.6rem 0.5rem; background: var(--bg-surface); border: 1px solid var(--border-light); color: var(--text-light); font-size: 0.85rem; font-weight: 700; border-radius: var(--radius-sm); text-align: center; cursor: pointer; transition: all 0.2s ease; }
.ep-btn:hover { background: rgba(255,255,255,0.1); }
.ep-btn.active { background: var(--gradient-primary); color: #fff; }`;

  const jsCode = `/**
 * XÓM PHIM - Vanilla JS App Logic (app.js)
 * Tự động tải 60 bộ phim mỗi trang danh mục bằng Promise.all()
 */
const API_BASE = 'https://phim.nguonc.com/api';
const MOVIES_PER_PAGE = 60;
const API_PAGES_CHUNK = 6; // Gọi song song 6 trang x 10 phim = 60 bộ phim

const state = {
  movies: [],
  currentPage: 1,
  currentCategory: 'phim-moi-cap-nhat',
  currentType: 'type',
  currentMovieDetail: null,
  currentServerIndex: 0,
  currentEpisodeIndex: 0
};

// 1. Tải 60 bộ phim cho danh mục/thể loại/quốc gia bằng Promise.all()
async function loadCategoryMovies(type = 'type', value = 'phim-moi-cap-nhat', page = 1) {
  try {
    const movieGrid = document.getElementById('movie-grid');
    if (movieGrid) {
      movieGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #a855f7;">Đang tải 60 bộ phim...</div>';
    }

    // Tính toán các trang API cần gọi song song (VD: page 1 -> trang API 1..6)
    const startApiPage = (page - 1) * API_PAGES_CHUNK + 1;
    const pagePromises = [];

    for (let i = 0; i < API_PAGES_CHUNK; i++) {
      const p = startApiPage + i;
      let url = '';
      if (type === 'type') {
        url = value === 'phim-moi-cap-nhat'
          ? \`\${API_BASE}/films/phim-moi-cap-nhat?page=\${p}&limit=60\`
          : \`\${API_BASE}/films/danh-sach/\${value}?page=\${p}&limit=60\`;
      } else if (type === 'genre') {
        url = \`\${API_BASE}/films/the-loai/\${value}?page=\${p}&limit=60\`;
      } else if (type === 'country') {
        url = \`\${API_BASE}/films/quoc-gia/\${value}?page=\${p}&limit=60\`;
      } else if (type === 'search') {
        url = \`\${API_BASE}/films/search?keyword=\${encodeURIComponent(value)}&page=\${p}&limit=60\`;
      }
      pagePromises.push(
        fetch(url)
          .then(res => res.json())
          .catch(err => {
            console.warn(\`Lỗi khi tải trang \${p}:\`, err);
            return null;
          })
      );
    }

    const results = await Promise.all(pagePromises);
    const validResults = results.filter(r => r && r.status === 'success' && Array.isArray(r.items));

    // Gộp (merge) mảng dữ liệu từ các trang và lọc trùng
    const mergedMovies = [];
    const seenSlugs = new Set();

    for (const res of validResults) {
      for (const item of res.items) {
        if (item && item.slug && !seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          mergedMovies.push(item);
          if (mergedMovies.length >= MOVIES_PER_PAGE) break;
        }
      }
      if (mergedMovies.length >= MOVIES_PER_PAGE) break;
    }

    state.movies = mergedMovies;
    renderMovieGrid(state.movies);
  } catch (error) {
    console.error('Lỗi khi tải danh sách phim:', error);
  }
}

// 2. Render danh sách phim ra Grid giao diện
function renderMovieGrid(movies) {
  const grid = document.getElementById('movie-grid');
  if (!grid) return;
  if (!movies || movies.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">Không tìm thấy bộ phim nào.</div>';
    return;
  }

  grid.innerHTML = movies.map(movie => \`
    <div class="movie-card" onclick="watchMovie('\${movie.slug}')">
      <div class="card-poster">
        <img src="\${movie.thumb_url || movie.poster_url}" alt="\${movie.name}" loading="lazy" />
        <span class="card-badge-top">\${movie.current_episode || 'HD'}</span>
      </div>
      <div class="card-info">
        <h4 class="card-title">\${movie.name}</h4>
        <p class="card-subtitle">\${movie.original_name || ''}</p>
      </div>
    </div>
  \`).join('');
}

// 3. Tải chi tiết phim & Link nhúng Iframe
async function watchMovie(slug) {
  try {
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('watch-view').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const res = await fetch(\`\${API_BASE}/film/\${slug}\`);
    const data = await res.json();
    if (data.status === 'success' && data.movie) {
      state.currentMovieDetail = data.movie;
      renderWatchPlayer(data.movie);
    }
  } catch (error) {
    console.error('Lỗi chi tiết phim:', error);
  }
}

function renderWatchPlayer(movie) {
  const server = movie.episodes && movie.episodes[0];
  if (server && server.items && server.items.length > 0) {
    // Gắn link embed iframe
    document.getElementById('video-player').src = server.items[0].embed;
    
    // Render các nút chọn tập
    const epGrid = document.getElementById('episode-list');
    if (epGrid) {
      epGrid.innerHTML = server.items.map((ep, idx) => \`
        <button class="ep-btn \${idx === 0 ? 'active' : ''}" onclick="changeEpisode(\${idx})">
          Tập \${ep.name}
        </button>
      \`).join('');
    }
  }
}

function changeEpisode(epIndex) {
  const server = state.currentMovieDetail && state.currentMovieDetail.episodes[state.currentServerIndex];
  if (server && server.items && server.items[epIndex]) {
    document.getElementById('video-player').src = server.items[epIndex].embed;
    document.querySelectorAll('.ep-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === epIndex);
    });
  }
}

// Khởi chạy khi load xong trang
document.addEventListener('DOMContentLoaded', () => {
  loadCategoryMovies('type', 'phim-moi-cap-nhat', 1);
});`;

  const handleCopy = (codeText: string, tabName: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(tabName);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadZipOrFiles = () => {
    // Download index.html
    const blobHtml = new Blob([htmlCode], { type: 'text/html' });
    const urlHtml = URL.createObjectURL(blobHtml);
    const a1 = document.createElement('a');
    a1.href = urlHtml;
    a1.download = 'index.html';
    a1.click();

    // Download style.css
    setTimeout(() => {
      const blobCss = new Blob([cssCode], { type: 'text/css' });
      const urlCss = URL.createObjectURL(blobCss);
      const a2 = document.createElement('a');
      a2.href = urlCss;
      a2.download = 'style.css';
      a2.click();
    }, 200);

    // Download app.js
    setTimeout(() => {
      const blobJs = new Blob([jsCode], { type: 'application/javascript' });
      const urlJs = URL.createObjectURL(blobJs);
      const a3 = document.createElement('a');
      a3.href = urlJs;
      a3.download = 'app.js';
      a3.click();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-[#111111] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#0d0d0d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Trọn Bộ Mã Nguồn Xóm Phim (HTML, CSS, JS Thuần)
              </h3>
              <p className="text-xs text-slate-400">
                Sẵn sàng 100% để deploy lên GitHub Pages hoặc bất kỳ hosting tĩnh nào
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZipOrFiles}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải 3 file (.html, .css, .js)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'html'
                  ? 'bg-pink-600/20 border border-pink-500/50 text-pink-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>index.html</span>
            </button>

            <button
              onClick={() => setActiveTab('css')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'css'
                  ? 'bg-purple-600/20 border border-purple-500/50 text-purple-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>style.css</span>
            </button>

            <button
              onClick={() => setActiveTab('js')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'js'
                  ? 'bg-yellow-600/20 border border-yellow-500/50 text-yellow-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>app.js</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Hướng Dẫn GitHub Pages</span>
            </button>
          </div>

          {activeTab !== 'guide' && (
            <button
              onClick={() => {
                const code =
                  activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode;
                handleCopy(code, activeTab);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-all shrink-0 cursor-pointer"
            >
              {copied === activeTab ? (
                <>
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Code</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#08080a] custom-scrollbar">
          {activeTab === 'guide' ? (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-200 space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-sm sm:text-base text-white">
                  🚀 Các bước đưa lên GitHub Pages trong 60 giây:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-200">
                  <li>Nhấn nút <strong>&quot;Tải 3 file&quot;</strong> ở góc trên.</li>
                  <li>Tạo một Repository mới trên GitHub (ví dụ: <code className="bg-black/60 px-1.5 py-0.5 rounded text-purple-300">xom-phim</code>).</li>
                  <li>Kéo thả 3 file (<code className="text-yellow-300 font-mono">index.html</code>, <code className="text-purple-300 font-mono">style.css</code>, <code className="text-pink-300 font-mono">app.js</code>) vào root repository rồi Commit.</li>
                  <li>Vào <strong>Settings &gt; Pages</strong> &gt; ở mục <strong>Branch</strong> chọn <code className="text-white font-bold">main</code> &gt; nhấn <strong>Save</strong>.</li>
                  <li>Trang web xem phim của bạn sẽ hoạt động trực tiếp tại địa chỉ: <code className="text-purple-300 font-mono">https://username.github.io/xom-phim/</code></li>
                </ol>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  Ghi chú về kết nối API:
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Hệ thống API phim hỗ trợ <strong>CORS: *</strong> và giao thức HTTPS, nên có thể chạy trực tiếp trên GitHub Pages, Vercel, Netlify mà không cần cấu hình thêm Backend Server hay Proxy.
                </p>
              </div>
            </div>
          ) : (
            <pre className="text-xs sm:text-sm font-mono text-slate-200 leading-relaxed overflow-x-auto p-2 select-all">
              <code>
                {activeTab === 'html' && htmlCode}
                {activeTab === 'css' && cssCode}
                {activeTab === 'js' && jsCode}
              </code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

