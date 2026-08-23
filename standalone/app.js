/**
 * ==========================================================================
 * CINEFLIX - VANILLA JAVASCRIPT APP LOGIC
 * Tích hợp nguồn dữ liệu NguonC API (phim.nguonc.com)
 * ==========================================================================
 */

// 1. Cấu hình hằng số & API Endpoints
const API_BASE = 'https://phim.nguonc.com/api';

const GENRES_LIST = [
  { name: 'Hành Động', slug: 'hanh-dong' },
  { name: 'Tình Cảm', slug: 'tinh-cam' },
  { name: 'Cổ Trang', slug: 'co-trang' },
  { name: 'Tâm Lý', slug: 'tam-ly' },
  { name: 'Hài Hước', slug: 'hai-huoc' },
  { name: 'Võ Thuật', slug: 'vo-thuat' },
  { name: 'Viễn Tưởng', slug: 'vien-tuong' },
  { name: 'Phiêu Lưu', slug: 'phieu-luu' },
  { name: 'Kinh Dị', slug: 'kinh-di' },
  { name: 'Khoa Học', slug: 'khoa-hoc' },
  { name: 'Thần Thoại', slug: 'than-thoai' },
  { name: 'Bí Ẩn', slug: 'bi-an' },
  { name: 'Học Đường', slug: 'hoc-duong' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
  { name: 'Hoạt Hình', slug: 'hoat-hinh' },
];

const COUNTRIES_LIST = [
  { name: 'Trung Quốc', slug: 'trung-quoc' },
  { name: 'Hàn Quốc', slug: 'han-quoc' },
  { name: 'Nhật Bản', slug: 'nhat-ban' },
  { name: 'Âu Mỹ', slug: 'au-my' },
  { name: 'Thái Lan', slug: 'thai-lan' },
  { name: 'Việt Nam', slug: 'viet-nam' },
  { name: 'Đài Loan', slug: 'dai-loan' },
  { name: 'Hồng Kông', slug: 'hong-kong' },
];

// 2. Trạng thái ứng dụng (Application State)
const state = {
  currentView: 'home', // 'home' | 'watch'
  currentCategoryType: 'type', // 'type' | 'genre' | 'country' | 'search'
  currentCategoryValue: 'phim-moi-cap-nhat',
  currentCategoryLabel: 'Phim Mới Cập Nhật',
  currentPage: 1,
  totalPages: 1,
  searchKeyword: '',
  
  // Dữ liệu phim
  movies: [],
  heroMovies: [],
  currentMovieDetail: null,
  currentServerIndex: 0,
  currentEpisodeIndex: 0,
  
  // Tiện ích UI
  isLightsOff: false,
  isTheaterMode: false,
};

// 3. Khởi tạo ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initDOMReferences();
  initDropdownMenus();
  initEventListeners();
  updateBadgeCounters();

  // Tải danh sách phim ban đầu
  loadMovies('type', 'phim-moi-cap-nhat', 'Phim Mới Cập Nhật', 1);
});

// Các phần tử DOM
let DOM = {};
function initDOMReferences() {
  DOM = {
    homeView: document.getElementById('home-view'),
    watchView: document.getElementById('watch-view'),
    heroBanner: document.getElementById('hero-banner'),
    sectionTitle: document.getElementById('section-title'),
    movieGrid: document.getElementById('movie-grid'),
    pagination: document.getElementById('pagination'),
    
    // Watch View
    videoPlayer: document.getElementById('video-player'),
    watchBreadcrumb: document.getElementById('watch-breadcrumb'),
    serverList: document.getElementById('server-list'),
    episodeList: document.getElementById('episode-list'),
    episodeChunks: document.getElementById('episode-chunks'),
    epSearchInput: document.getElementById('episode-search-input'),
    movieDetailInfo: document.getElementById('movie-detail-info'),
    relatedGrid: document.getElementById('related-grid'),
    
    // Search
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    searchSuggestions: document.getElementById('search-suggestions'),
    
    // Badges & Modals
    bookmarkBadge: document.getElementById('bookmark-badge'),
    historyBadge: document.getElementById('history-badge'),
    bookmarksModal: document.getElementById('bookmarks-modal'),
    modalBody: document.getElementById('modal-body'),
    lightsOverlay: document.getElementById('lights-overlay'),
    mobileMenu: document.getElementById('mobile-menu'),
  };
}

// 4. Khởi tạo Dropdown Thể loại & Quốc gia
function initDropdownMenus() {
  const genreMenu = document.getElementById('genre-dropdown-menu');
  const countryMenu = document.getElementById('country-dropdown-menu');

  if (genreMenu) {
    genreMenu.innerHTML = GENRES_LIST.map(
      (g) => `<button class="dropdown-item" data-genre="${g.slug}">${g.name}</button>`
    ).join('');
  }

  if (countryMenu) {
    countryMenu.innerHTML = COUNTRIES_LIST.map(
      (c) => `<button class="dropdown-item" data-country="${c.slug}">${c.name}</button>`
    ).join('');
  }
}

// 5. Gắn sự kiện (Event Listeners)
function initEventListeners() {
  // Click Logo -> Về trang chủ
  document.getElementById('logo-btn').addEventListener('click', (e) => {
    e.preventDefault();
    loadMovies('type', 'phim-moi-cap-nhat', 'Phim Mới Cập Nhật', 1);
    switchView('home');
  });

  // Nút quay lại từ trang xem phim
  document.getElementById('btn-back-home').addEventListener('click', () => {
    switchView('home');
  });

  // Menu Desktop navigation
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      loadMovies('type', type, btn.textContent.trim(), 1);
    });
  });

  // Mobile menu toggle
  document.getElementById('btn-mobile-toggle').addEventListener('click', () => {
    DOM.mobileMenu.classList.toggle('hidden');
  });

  // Mobile menu buttons
  document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      DOM.mobileMenu.classList.add('hidden');
      loadMovies('type', type, btn.textContent.trim(), 1);
    });
  });

  // Dropdown genre click
  document.getElementById('genre-dropdown-menu')?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-genre]');
    if (target) {
      const slug = target.getAttribute('data-genre');
      loadMovies('genre', slug, `Thể Loại: ${target.textContent.trim()}`, 1);
    }
  });

  // Dropdown country click
  document.getElementById('country-dropdown-menu')?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-country]');
    if (target) {
      const slug = target.getAttribute('data-country');
      loadMovies('country', slug, `Quốc Gia: ${target.textContent.trim()}`, 1);
    }
  });

  // Tìm kiếm với Debounce
  let searchTimer = null;
  DOM.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      DOM.searchClear.classList.remove('hidden');
    } else {
      DOM.searchClear.classList.add('hidden');
      DOM.searchSuggestions.classList.add('hidden');
      return;
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      fetchLiveSuggestions(val);
    }, 350);
  });

  DOM.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keyword = DOM.searchInput.value.trim();
      if (keyword) {
        DOM.searchSuggestions.classList.add('hidden');
        loadMovies('search', keyword, `Tìm kiếm: "${keyword}"`, 1);
      }
    }
  });

  DOM.searchClear.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.searchClear.classList.add('hidden');
    DOM.searchSuggestions.classList.add('hidden');
  });

  // Player controls
  document.getElementById('btn-prev-ep').addEventListener('click', () => {
    if (state.currentEpisodeIndex > 0) {
      selectEpisode(state.currentEpisodeIndex - 1);
    }
  });

  document.getElementById('btn-next-ep').addEventListener('click', () => {
    const server = state.currentMovieDetail?.episodes[state.currentServerIndex];
    if (server && state.currentEpisodeIndex < server.items.length - 1) {
      selectEpisode(state.currentEpisodeIndex + 1);
    }
  });

  document.getElementById('btn-reload-player').addEventListener('click', () => {
    const currentSrc = DOM.videoPlayer.src;
    DOM.videoPlayer.src = '';
    setTimeout(() => {
      DOM.videoPlayer.src = currentSrc;
    }, 100);
  });

  // Tắt đèn (Lights off)
  document.getElementById('btn-toggle-lights').addEventListener('click', () => {
    state.isLightsOff = !state.isLightsOff;
    DOM.lightsOverlay.classList.toggle('hidden', !state.isLightsOff);
  });

  DOM.lightsOverlay.addEventListener('click', () => {
    state.isLightsOff = false;
    DOM.lightsOverlay.classList.add('hidden');
  });

  // Modals Yêu thích & Lịch sử
  document.getElementById('btn-open-bookmarks').addEventListener('click', () => {
    openModal('favorites');
  });

  document.getElementById('btn-open-history').addEventListener('click', () => {
    openModal('history');
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    DOM.bookmarksModal.classList.add('hidden');
  });

  document.getElementById('tab-fav').addEventListener('click', () => {
    switchModalTab('favorites');
  });

  document.getElementById('tab-hist').addEventListener('click', () => {
    switchModalTab('history');
  });

  // Tìm kiếm số tập nhanh
  DOM.epSearchInput.addEventListener('input', (e) => {
    renderEpisodeGrid(e.target.value.trim());
  });
}

// 6. Fetch API NguonC & Render Phim
async function loadMovies(type, value, label, page = 1) {
  state.currentCategoryType = type;
  state.currentCategoryValue = value;
  state.currentCategoryLabel = label;
  state.currentPage = page;

  DOM.sectionTitle.textContent = label;
  DOM.movieGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
      <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
      <p style="margin-top: 1rem; color: var(--text-muted);">Đang tải danh sách phim từ NguonC...</p>
    </div>
  `;

  try {
    let url = '';
    if (type === 'type') {
      url = value === 'phim-moi-cap-nhat' 
        ? `${API_BASE}/films/phim-moi-cap-nhat?page=${page}`
        : `${API_BASE}/films/danh-sach/${value}?page=${page}`;
    } else if (type === 'genre') {
      url = `${API_BASE}/films/the-loai/${value}?page=${page}`;
    } else if (type === 'country') {
      url = `${API_BASE}/films/quoc-gia/${value}?page=${page}`;
    } else if (type === 'search') {
      url = `${API_BASE}/films/search?keyword=${encodeURIComponent(value)}&page=${page}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success' && data.items) {
      state.movies = data.items;
      state.totalPages = data.paginate?.total_page || 1;

      // Render Hero Banner nếu ở trang 1 của Phim Mới
      if (type === 'type' && value === 'phim-moi-cap-nhat' && page === 1) {
        state.heroMovies = data.items.slice(0, 5);
        renderHeroBanner(state.heroMovies[0]);
        DOM.heroBanner.classList.remove('hidden');
      } else if (page === 1 && state.heroMovies.length === 0) {
        renderHeroBanner(data.items[0]);
      }

      renderMovieGrid(state.movies);
      renderPagination(state.currentPage, state.totalPages);
      switchView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      DOM.movieGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
          <i class="fa-solid fa-circle-exclamation fa-2x" style="color: var(--text-dim);"></i>
          <p style="margin-top: 1rem; color: var(--text-muted);">Không tìm thấy bộ phim nào phù hợp.</p>
        </div>
      `;
      DOM.pagination.innerHTML = '';
    }
  } catch (error) {
    console.error('Lỗi khi tải danh sách phim:', error);
    DOM.movieGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-triangle-exclamation fa-2x" style="color: var(--primary);"></i>
        <p style="margin-top: 1rem; color: var(--text-muted);">Đã xảy ra lỗi khi kết nối máy chủ API.</p>
      </div>
    `;
  }
}

// 7. Render Hero Banner
function renderHeroBanner(movie) {
  if (!movie) {
    DOM.heroBanner.classList.add('hidden');
    return;
  }

  const bgImg = movie.poster_url || movie.thumb_url;
  const desc = movie.description 
    ? movie.description.replace(/<[^>]*>?/gm, '') 
    : 'Thưởng thức bộ phim bom tấn đỉnh cao với đường truyền mượt mà chất lượng cao trên CineFlix.';

  DOM.heroBanner.innerHTML = `
    <div class="hero-backdrop" style="background-image: url('${bgImg}');"></div>
    <div class="hero-gradient"></div>
    <div class="container hero-content">
      <div>
        <div class="hero-meta">
          <span class="badge-hot"><i class="fa-solid fa-fire"></i> Phim Nổi Bật</span>
          <span class="badge-quality">${movie.quality || 'Full HD'}</span>
          <span class="badge-quality" style="background: rgba(255,255,255,0.1); color:#fff;">${movie.current_episode || 'Mới cập nhật'}</span>
        </div>
        <h1 class="hero-title">${movie.name}</h1>
        <p class="hero-orig-title">${movie.original_name || ''}</p>
        <p class="hero-desc">${desc}</p>
        <div class="hero-actions">
          <button class="btn-primary-gradient" onclick="watchMovie('${movie.slug}')">
            <i class="fa-solid fa-play"></i> Xem Ngay
          </button>
          <button class="btn-glass" onclick="watchMovie('${movie.slug}')">
            <i class="fa-solid fa-circle-info"></i> Chi Tiết
          </button>
        </div>
      </div>
      <div class="hero-poster-box">
        <img src="${bgImg}" alt="${movie.name}" />
      </div>
    </div>
  `;
}

// 8. Render Lưới Thẻ Phim (Movie Grid)
function renderMovieGrid(movies) {
  if (!movies || movies.length === 0) return;

  DOM.movieGrid.innerHTML = movies.map((m) => {
    const poster = m.poster_url || m.thumb_url;
    return `
      <div class="movie-card" onclick="watchMovie('${m.slug}')">
        <div class="card-poster">
          <img src="${poster}" alt="${m.name}" loading="lazy" onerror="this.src='https://placehold.co/300x450/121724/white?text=CineFlix'" />
          <span class="card-badge-top">${m.current_episode || 'HD'}</span>
          <span class="card-badge-right">${m.quality || 'HD'}</span>
          <div class="card-play-overlay">
            <div class="play-circle"><i class="fa-solid fa-play"></i></div>
          </div>
        </div>
        <div class="card-info">
          <div>
            <h3 class="card-title" title="${m.name}">${m.name}</h3>
            <p class="card-orig">${m.original_name || 'NguonC HD'}</p>
          </div>
          <div class="card-footer">
            <span>${m.time || 'HD Online'}</span>
            <span class="card-watch-link">Xem <i class="fa-solid fa-angle-right"></i></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 9. Xem chi tiết phim & Tải link Embed Iframe (Watch View SPA)
async function watchMovie(slug) {
  try {
    // Chuyển sang Watch View & Hiển thị skeleton
    switchView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    DOM.videoPlayer.src = '';
    DOM.movieDetailInfo.innerHTML = `
      <div style="text-align: center; padding: 3rem 0;">
        <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
        <p style="margin-top: 1rem; color: var(--text-muted);">Đang tải dữ liệu phim và nguồn video...</p>
      </div>
    `;

    const res = await fetch(`${API_BASE}/film/${slug}`);
    const data = await res.json();

    if (data.status === 'success' && data.movie) {
      const movie = data.movie;
      state.currentMovieDetail = movie;
      state.currentServerIndex = 0;
      state.currentEpisodeIndex = 0;

      // Render Servers & Episodes
      renderServerButtons(movie.episodes);
      renderEpisodeGrid();
      renderMovieDetailInfo(movie);

      // Phát tập đầu tiên
      selectEpisode(0);

      // Tải phim đề xuất cùng thể loại
      loadRelatedMovies(movie);
    }
  } catch (error) {
    console.error('Lỗi khi tải chi tiết phim:', error);
  }
}

// Render Nút Chọn Server
function renderServerButtons(servers) {
  if (!servers || servers.length === 0) {
    DOM.serverList.innerHTML = '<p style="color: var(--text-dim); font-size: 0.8rem;">Không tìm thấy server phát.</p>';
    return;
  }

  DOM.serverList.innerHTML = servers.map((srv, idx) => `
    <button class="server-btn ${idx === state.currentServerIndex ? 'active' : ''}" onclick="selectServer(${idx})">
      <i class="fa-solid fa-play"></i> ${srv.server_name} (${srv.items.length} tập)
    </button>
  `).join('');
}

// Chọn Server
function selectServer(serverIndex) {
  state.currentServerIndex = serverIndex;
  state.currentEpisodeIndex = 0;
  
  // Cập nhật active button server
  document.querySelectorAll('.server-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === serverIndex);
  });

  renderEpisodeGrid();
  selectEpisode(0);
}

// Render Danh Sách Tập Phim
function renderEpisodeGrid(filterQuery = '') {
  const currentServer = state.currentMovieDetail?.episodes[state.currentServerIndex];
  if (!currentServer || !currentServer.items) return;

  const items = currentServer.items;
  const filtered = filterQuery
    ? items.filter((ep) => ep.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : items;

  DOM.episodeList.innerHTML = filtered.map((ep, idx) => {
    const originalIdx = items.findIndex((e) => e.slug === ep.slug);
    const isActive = originalIdx === state.currentEpisodeIndex;
    return `
      <button class="ep-btn ${isActive ? 'active' : ''}" onclick="selectEpisode(${originalIdx})">
        Tập ${ep.name}
      </button>
    `;
  }).join('');
}

// Chọn & Phát Tập Phim
function selectEpisode(epIndex) {
  const currentServer = state.currentMovieDetail?.episodes[state.currentServerIndex];
  if (!currentServer || !currentServer.items[epIndex]) return;

  state.currentEpisodeIndex = epIndex;
  const activeEpisode = currentServer.items[epIndex];

  // Gắn link embed iframe
  DOM.videoPlayer.src = activeEpisode.embed;

  // Cập nhật active class cho nút tập
  document.querySelectorAll('.ep-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === epIndex);
  });

  // Cập nhật Breadcrumb
  DOM.watchBreadcrumb.innerHTML = `
    <span>Phim: </span><strong>${state.currentMovieDetail.name}</strong> / 
    <span class="ep-tag">Tập ${activeEpisode.name}</span> (${currentServer.server_name})
  `;

  // Lưu lịch sử xem phim
  saveToHistory(state.currentMovieDetail, currentServer.server_name, activeEpisode.name);
}

// Render Thông Tin Chi Tiết Phim
function renderMovieDetailInfo(movie) {
  const poster = movie.poster_url || movie.thumb_url;
  const desc = movie.description ? movie.description.replace(/<[^>]*>?/gm, '') : 'Đang cập nhật nội dung.';
  const isSaved = isMovieBookmarked(movie.slug);

  DOM.movieDetailInfo.innerHTML = `
    <div class="movie-detail-grid">
      <div class="movie-detail-poster">
        <img src="${poster}" alt="${movie.name}" />
      </div>
      <div class="movie-detail-meta">
        <h2>${movie.name}</h2>
        <p class="orig-name">${movie.original_name || ''}</p>
        
        <div class="meta-tags">
          <span class="tag-badge" style="background: var(--primary); color:#fff;">${movie.quality || 'HD'}</span>
          <span class="tag-badge">${movie.current_episode || 'Mới'}</span>
          <span class="tag-badge">${movie.language || 'Vietsub'}</span>
          <span class="tag-badge">${movie.time || 'Đang cập nhật'}</span>
        </div>

        <div style="margin-bottom: 1rem;">
          <button class="btn-glass" id="btn-toggle-fav" onclick="handleToggleBookmark()">
            <i class="fa-solid fa-bookmark" style="${isSaved ? 'color: var(--primary);' : ''}"></i> 
            ${isSaved ? 'Đã Lưu Yêu Thích' : 'Lưu Vào Yêu Thích'}
          </button>
        </div>

        <div class="synopsis-box">
          <h4>Nội dung phim:</h4>
          <p>${desc}</p>
        </div>
      </div>
    </div>
  `;
}

// Tải Phim Đề Xuất
async function loadRelatedMovies(currentMovie) {
  try {
    const res = await fetch(`${API_BASE}/films/phim-moi-cap-nhat?page=2`);
    const data = await res.json();
    if (data.items) {
      DOM.relatedGrid.innerHTML = data.items.slice(0, 5).map((m) => `
        <div class="movie-card" onclick="watchMovie('${m.slug}')">
          <div class="card-poster">
            <img src="${m.poster_url || m.thumb_url}" alt="${m.name}" />
            <span class="card-badge-top">${m.current_episode || 'HD'}</span>
          </div>
          <div class="card-info">
            <h3 class="card-title">${m.name}</h3>
          </div>
        </div>
      `).join('');
    }
  } catch {
    // ignore
  }
}

// 10. Render Phân Trang
function renderPagination(current, total) {
  if (total <= 1) {
    DOM.pagination.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn" ${current <= 1 ? 'disabled' : ''} onclick="changePage(${current - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(total, current + 2);

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === current ? 'active' : ''}" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="page-btn" ${current >= total ? 'disabled' : ''} onclick="changePage(${current + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  DOM.pagination.innerHTML = html;
}

function changePage(page) {
  loadMovies(state.currentCategoryType, state.currentCategoryValue, state.currentCategoryLabel, page);
}

// 11. Xử lý Chuyển View (SPA Switcher)
function switchView(viewName) {
  state.currentView = viewName;
  if (viewName === 'home') {
    DOM.homeView.classList.remove('hidden');
    DOM.watchView.classList.add('hidden');
    DOM.videoPlayer.src = ''; // Dừng phát video
  } else if (viewName === 'watch') {
    DOM.homeView.classList.add('hidden');
    DOM.watchView.classList.remove('hidden');
  }
}

// 12. Tìm kiếm Gợi ý Trực tiếp
async function fetchLiveSuggestions(query) {
  try {
    const res = await fetch(`${API_BASE}/films/search?keyword=${encodeURIComponent(query)}&page=1`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      DOM.searchSuggestions.innerHTML = data.items.slice(0, 5).map((m) => `
        <div class="suggestion-item" onclick="watchMovie('${m.slug}'); DOM.searchSuggestions.classList.add('hidden');">
          <img class="suggestion-thumb" src="${m.thumb_url || m.poster_url}" alt="${m.name}" />
          <div class="suggestion-info">
            <h4>${m.name}</h4>
            <p>${m.original_name || 'HD'}</p>
          </div>
        </div>
      `).join('');
      DOM.searchSuggestions.classList.remove('hidden');
    } else {
      DOM.searchSuggestions.classList.add('hidden');
    }
  } catch {
    DOM.searchSuggestions.classList.add('hidden');
  }
}

// 13. Lưu trữ Yêu Thích & Lịch Sử (LocalStorage)
const STORAGE_FAV_KEY = 'cineflix_vanilla_favs';
const STORAGE_HIST_KEY = 'cineflix_vanilla_hist';

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function isMovieBookmarked(slug) {
  return getBookmarks().some((m) => m.slug === slug);
}

function handleToggleBookmark() {
  if (!state.currentMovieDetail) return;
  const m = state.currentMovieDetail;
  let list = getBookmarks();
  const exists = list.some((item) => item.slug === m.slug);

  if (exists) {
    list = list.filter((item) => item.slug !== m.slug);
  } else {
    list.unshift({
      slug: m.slug,
      name: m.name,
      poster: m.poster_url || m.thumb_url,
      episode: m.current_episode || 'HD',
    });
  }

  localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(list));
  updateBadgeCounters();
  renderMovieDetailInfo(m);
}

function saveToHistory(movie, serverName, episodeName) {
  try {
    let list = JSON.parse(localStorage.getItem(STORAGE_HIST_KEY)) || [];
    list = list.filter((item) => item.slug !== movie.slug);
    list.unshift({
      slug: movie.slug,
      name: movie.name,
      poster: movie.poster_url || movie.thumb_url,
      serverName,
      episodeName,
      time: Date.now(),
    });
    localStorage.setItem(STORAGE_HIST_KEY, JSON.stringify(list.slice(0, 20)));
    updateBadgeCounters();
  } catch {
    // ignore
  }
}

function updateBadgeCounters() {
  const favs = getBookmarks();
  let hist = [];
  try {
    hist = JSON.parse(localStorage.getItem(STORAGE_HIST_KEY)) || [];
  } catch {
    // ignore
  }

  if (DOM.bookmarkBadge) {
    DOM.bookmarkBadge.textContent = favs.length;
    DOM.bookmarkBadge.classList.toggle('hidden', favs.length === 0);
  }
  if (DOM.historyBadge) {
    DOM.historyBadge.textContent = hist.length;
    DOM.historyBadge.classList.toggle('hidden', hist.length === 0);
  }
}

function openModal(tab) {
  DOM.bookmarksModal.classList.remove('hidden');
  switchModalTab(tab);
}

function switchModalTab(tab) {
  document.getElementById('tab-fav').classList.toggle('active', tab === 'favorites');
  document.getElementById('tab-hist').classList.toggle('active', tab === 'history');

  if (tab === 'favorites') {
    const list = getBookmarks();
    if (list.length === 0) {
      DOM.modalBody.innerHTML = '<p style="text-align:center; color: var(--text-dim); padding: 2rem;">Chưa có phim yêu thích nào.</p>';
    } else {
      DOM.modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem;">
          ${list.map((m) => `
            <div style="cursor: pointer;" onclick="watchMovie('${m.slug}'); DOM.bookmarksModal.classList.add('hidden');">
              <img src="${m.poster}" style="width:100%; aspect-ratio:2/3; object-fit:cover; border-radius: 8px;" />
              <h5 style="font-size: 0.78rem; margin-top: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color:#fff;">${m.name}</h5>
            </div>
          `).join('')}
        </div>
      `;
    }
  } else {
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(STORAGE_HIST_KEY)) || []; } catch {}
    if (hist.length === 0) {
      DOM.modalBody.innerHTML = '<p style="text-align:center; color: var(--text-dim); padding: 2rem;">Lịch sử xem phim trống.</p>';
    } else {
      DOM.modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
          ${hist.map((h) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.04); border-radius: 8px; cursor: pointer;" onclick="watchMovie('${h.slug}'); DOM.bookmarksModal.classList.add('hidden');">
              <div style="display: flex; align-items: center; gap: 0.8rem;">
                <img src="${h.poster}" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px;" />
                <div>
                  <h5 style="font-size: 0.85rem; color: #fff;">${h.name}</h5>
                  <span style="font-size: 0.75rem; color: var(--primary);">Đang xem: Tập ${h.episodeName} (${h.serverName})</span>
                </div>
              </div>
              <button class="btn-primary-gradient" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">Xem tiếp</button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}
