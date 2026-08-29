import { ApiResponseDetail, ApiResponseList, CategoryOption, MovieDetail, MovieItem } from '../types/movie';

const API_BASE_URL = 'https://phim.nguonc.com/api';

export const MOVIE_TYPES: CategoryOption[] = [
  { name: 'Phim Mới Cập Nhật', slug: 'phim-moi-cap-nhat' },
  { name: 'Phim Bộ', slug: 'phim-bo' },
  { name: 'Phim Lẻ', slug: 'phim-le' },
  { name: 'Hoạt Hình & Anime', slug: 'hoat-hinh' },
  { name: 'TV Shows', slug: 'tv-shows' },
];

export const GENRES: CategoryOption[] = [
  { 
    name: 'Đam Mỹ', 
    slug: 'dam-my', 
    description: 'Tình cảm boy love, thanh xuân ngọt ngào' 
  },
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
  { name: 'Chính Kịch', slug: 'chinh-kich' },
  { name: 'Bí Ẩn', slug: 'bi-an' },
  { name: 'Học Đường', slug: 'hoc-duong' },
  { name: 'Âm Nhạc', slug: 'am-nhac' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
  { name: 'Tài Liệu', slug: 'tai-lieu' },
  { name: 'Chiến Tranh', slug: 'chien-tranh' },
  { name: 'Thể Thao', slug: 'the-thao' },
  { name: 'Kinh Điển', slug: 'kinh-dien' },
];

export const COUNTRIES: CategoryOption[] = [
  { name: 'Trung Quốc', slug: 'trung-quoc' },
  { name: 'Hàn Quốc', slug: 'han-quoc' },
  { name: 'Nhật Bản', slug: 'nhat-ban' },
  { name: 'Âu Mỹ', slug: 'au-my' },
  { name: 'Thái Lan', slug: 'thai-lan' },
  { name: 'Việt Nam', slug: 'viet-nam' },
  { name: 'Đài Loan', slug: 'dai-loan' },
  { name: 'Hồng Kông', slug: 'hong-kong' },
  { name: 'Ấn Độ', slug: 'an-do' },
];

// In-memory cache
const cache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const MOVIES_PER_PAGE_TARGET = 60;
const API_PAGE_CHUNK = 6; // 6 pages of 10 items = 60 items

/**
 * Fetch wrapper with multi-tier failover:
 * 1. Vite proxy endpoint (/api-nguonc/...)
 * 2. Direct endpoint (https://phim.nguonc.com/api/...)
 * 3. Public CORS fallback
 */
async function fetchApiEndpoint<T>(pathClean: string): Promise<T> {
  const cleanPath = pathClean.startsWith('/') ? pathClean.slice(1) : pathClean;
  const cacheKey = cleanPath;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const directUrl = `${API_BASE_URL}/${cleanPath}`;
  const proxyUrl = `/api-nguonc/${cleanPath}`;
  const corsFallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;

  const candidateUrls = [proxyUrl, directUrl, corsFallbackUrl];
  let lastError: unknown = null;

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && (text.startsWith('{') || text.startsWith('['))) {
          const parsed = JSON.parse(text);
          cache.set(cacheKey, { timestamp: Date.now(), data: parsed });
          return parsed as T;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Không thể kết nối đến API: ${cleanPath}`);
}

/**
 * Intelligent pagination fetcher for 60 movies per page:
 * - Queries the first page first to check total_page
 * - Only queries subsequent pages that actually exist
 * - Avoids flooding the API with empty/redundant requests
 */
async function fetchCategoryWith60Limit(
  urlBuilder: (apiPage: number) => string,
  userPage: number = 1
): Promise<ApiResponseList> {
  const startApiPage = (userPage - 1) * API_PAGE_CHUNK + 1;

  try {
    // 1. Fetch the first API page
    const firstPath = urlBuilder(startApiPage);
    const firstRes = await fetchApiEndpoint<ApiResponseList>(firstPath).catch((err) => {
      console.warn(`Lỗi khi tải trang đầu ${startApiPage}:`, err);
      return null;
    });

    if (!firstRes || !firstRes.items || firstRes.items.length === 0) {
      return {
        status: 'error',
        items: [],
        paginate: {
          current_page: userPage,
          total_page: 1,
          total_items: 0,
          items_per_page: MOVIES_PER_PAGE_TARGET,
        },
      };
    }

    // If API returned 60+ items in a single response
    if (firstRes.items.length >= MOVIES_PER_PAGE_TARGET) {
      const totalItems = firstRes.paginate?.total_items || firstRes.items.length;
      return {
        ...firstRes,
        items: firstRes.items.slice(0, MOVIES_PER_PAGE_TARGET),
        paginate: {
          current_page: userPage,
          total_page: Math.max(1, Math.ceil(totalItems / MOVIES_PER_PAGE_TARGET)),
          total_items: totalItems,
          items_per_page: Math.min(MOVIES_PER_PAGE_TARGET, firstRes.items.length),
        },
      };
    }

    const mergedItems: MovieItem[] = [...firstRes.items];
    const seenSlugs = new Set<string>(mergedItems.map((m) => m.slug));

    const totalApiPages = firstRes.paginate?.total_page ?? 1;
    const totalItems = firstRes.paginate?.total_items ?? mergedItems.length;

    // 2. Only fetch additional pages if more exist
    if (totalApiPages > startApiPage && mergedItems.length < MOVIES_PER_PAGE_TARGET) {
      const maxApiPage = Math.min(startApiPage + API_PAGE_CHUNK - 1, totalApiPages);
      const remainingPages: number[] = [];
      for (let p = startApiPage + 1; p <= maxApiPage; p++) {
        remainingPages.push(p);
      }

      if (remainingPages.length > 0) {
        const extraResults = await Promise.allSettled(
          remainingPages.map((p) => fetchApiEndpoint<ApiResponseList>(urlBuilder(p)))
        );

        for (const result of extraResults) {
          if (result.status === 'fulfilled' && result.value?.items) {
            for (const item of result.value.items) {
              if (item && item.slug && !seenSlugs.has(item.slug)) {
                seenSlugs.add(item.slug);
                mergedItems.push(item);
                if (mergedItems.length >= MOVIES_PER_PAGE_TARGET) break;
              }
            }
          }
          if (mergedItems.length >= MOVIES_PER_PAGE_TARGET) break;
        }
      }
    }

    const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / MOVIES_PER_PAGE_TARGET));

    return {
      status: 'success',
      cat: firstRes.cat,
      paginate: {
        current_page: userPage,
        total_page: calculatedTotalPages,
        total_items: totalItems,
        items_per_page: mergedItems.length,
      },
      items: mergedItems,
    };
  } catch (error) {
    console.warn(`Lỗi khi fetch danh mục:`, error);
    return {
      status: 'error',
      items: [],
      paginate: {
        current_page: userPage,
        total_page: 1,
        total_items: 0,
        items_per_page: MOVIES_PER_PAGE_TARGET,
      },
    };
  }
}

/**
 * Lấy danh sách phim mới nhất (60 phim/trang)
 */
export async function getNewMovies(page = 1): Promise<ApiResponseList> {
  return fetchCategoryWith60Limit((p) => `films/phim-moi-cap-nhat?page=${p}`, page);
}

/**
 * Lấy danh sách theo phân loại: phim-bo, phim-le, hoat-hinh, tv-shows (60 phim/trang)
 */
export async function getMoviesByType(typeSlug: string, page = 1): Promise<ApiResponseList> {
  if (typeSlug === 'phim-moi-cap-nhat') {
    return getNewMovies(page);
  }
  return fetchCategoryWith60Limit((p) => `films/danh-sach/${typeSlug}?page=${p}`, page);
}

/**
 * Lấy danh sách phim theo thể loại (60 phim/trang)
 */
export async function getMoviesByGenre(genreSlug: string, page = 1): Promise<ApiResponseList> {
  return fetchCategoryWith60Limit((p) => `films/the-loai/${genreSlug}?page=${p}`, page);
}

/**
 * Lấy danh sách phim theo quốc gia (60 phim/trang)
 */
export async function getMoviesByCountry(countrySlug: string, page = 1): Promise<ApiResponseList> {
  return fetchCategoryWith60Limit((p) => `films/quoc-gia/${countrySlug}?page=${p}`, page);
}

/**
 * Tìm kiếm phim theo từ khóa (60 phim/trang)
 */
export async function searchMovies(keyword: string, page = 1): Promise<ApiResponseList> {
  const encoded = encodeURIComponent(keyword.trim());
  return fetchCategoryWith60Limit((p) => `films/search?keyword=${encoded}&page=${p}`, page);
}

/**
 * Tìm kiếm nhanh dùng cho live autocomplete trên thanh Search (chỉ tải 1 trang nhẹ)
 */
export async function searchQuickSuggestions(keyword: string): Promise<MovieItem[]> {
  if (!keyword.trim()) return [];
  try {
    const encoded = encodeURIComponent(keyword.trim());
    const data = await fetchApiEndpoint<ApiResponseList>(`films/search?keyword=${encoded}&page=1`);
    return data?.items || [];
  } catch {
    return [];
  }
}

/**
 * Lấy chi tiết bộ phim và danh sách link xem phim (tập phim & embed iframe)
 */
export async function getMovieDetail(slug: string): Promise<MovieDetail> {
  const data = await fetchApiEndpoint<ApiResponseDetail>(`film/${slug}`);
  if (data.status === 'success' && data.movie) {
    return data.movie;
  }
  throw new Error(data.msg || 'Không thể tải thông tin phim');
}

/**
 * Lấy danh sách 30 bộ phim cho hàng ngang (Horizontal Sliders) trên Trang chủ.
 */
export async function getMoviesForRow(
  slug: string,
  type: 'type' | 'genre' | 'country' = 'type',
  targetCount = 30
): Promise<MovieItem[]> {
  try {
    const getPath = (p: number) => {
      if (type === 'type') {
        return slug === 'phim-moi-cap-nhat' ? `films/phim-moi-cap-nhat?page=${p}` : `films/danh-sach/${slug}?page=${p}`;
      } else if (type === 'genre') {
        return `films/the-loai/${slug}?page=${p}`;
      } else {
        return `films/quoc-gia/${slug}?page=${p}`;
      }
    };

    const firstRes = await fetchApiEndpoint<ApiResponseList>(getPath(1)).catch(() => null);
    if (!firstRes || !firstRes.items || firstRes.items.length === 0) {
      return [];
    }

    const merged: MovieItem[] = [...firstRes.items];
    const seenSlugs = new Set<string>(merged.map((m) => m.slug));

    const totalPages = firstRes.paginate?.total_page ?? 1;
    if (merged.length < targetCount && totalPages > 1) {
      const extraPages = [2, 3].filter((p) => p <= totalPages);
      const extraResults = await Promise.allSettled(
        extraPages.map((p) => fetchApiEndpoint<ApiResponseList>(getPath(p)))
      );

      for (const result of extraResults) {
        if (result.status === 'fulfilled' && result.value?.items) {
          for (const movie of result.value.items) {
            if (movie && movie.slug && !seenSlugs.has(movie.slug)) {
              seenSlugs.add(movie.slug);
              merged.push(movie);
              if (merged.length >= targetCount) break;
            }
          }
        }
        if (merged.length >= targetCount) break;
      }
    }

    return merged.slice(0, targetCount);
  } catch (error) {
    console.warn(`Lỗi khi lấy 30 phim cho hàng ngang ${slug}:`, error);
    return [];
  }
}
// Link CSV xuất bản từ Google Sheet của bạn
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGYPjV2eNr_elQre2K5yGiWlcfAvR1r6Sp46YfWT0Sccw0xQYNDvxCBotnX9JlUX0YkBNvycXIfCwi/pub?gid=0&single=true&output=csv';

/**
 * Lấy danh sách phim Đam Mỹ trực tiếp từ API URL / Slug trong Google Sheets
 * Ưu tiên:
 * 1. Phim đang cập nhật (đang chiếu) xếp lên đầu
 * 2. Phim có tập mới / chỉnh sửa gần nhất xếp trước
 */
export async function getBLMoviesFromSheet(page: number = 1): Promise<ApiResponseList> {
  try {
    const sheetRes = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
    if (!sheetRes.ok) throw new Error('Không thể kết nối Google Sheets');
    
    const csvText = await sheetRes.text();

    const rawLines = csvText
      .split('\n')
      .map((line) => line.trim().replace(/^"|"$/g, '').replace(/\r/g, ''))
      .filter((line) => line.length > 0 && !line.toLowerCase().includes('tên phim') && !line.toLowerCase().includes('slug') && !line.toLowerCase().includes('api'));

    if (rawLines.length === 0) {
      return {
        status: 'success',
        items: [],
        paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 24 }
      };
    }

    const moviePromises = rawLines.map(async (item) => {
      let slug = item;
      if (item.includes('/film/')) {
        slug = item.split('/film/')[1].replace(/\/$/, '');
      } else if (item.includes('/phim/')) {
        slug = item.split('/phim/')[1].replace(/\/$/, '');
      } else if (item.startsWith('http')) {
        slug = item.substring(item.lastIndexOf('/') + 1);
      }

      try {
        const detail = await getMovieDetail(slug);
        return detail as MovieItem;
      } catch (err) {
        console.warn(`Không tìm thấy phim với slug: ${slug}`, err);
        return null;
      }
    });

    const results = await Promise.all(moviePromises);
    const blMovies: MovieItem[] = results.filter((m): m is MovieItem => m !== null);

    // Hàm kiểm tra phim đã kết thúc hay chưa
    const checkIsOngoing = (movie: any): boolean => {
      const epRaw = (movie?.current_episode || '').trim().toLowerCase();
      const statusRaw = (movie?.status || '').trim().toLowerCase();

      // Nếu chứa các từ khóa kết thúc -> Đã hoàn thành (false)
      if (
        epRaw.includes('full') ||
        epRaw.includes('hoàn tất') ||
        epRaw.includes('hoàn thành') ||
        epRaw.includes('trọn bộ') ||
        epRaw.includes('end') ||
        epRaw.includes('đã kết thúc') ||
        statusRaw.includes('hoàn tất') ||
        statusRaw.includes('hoàn thành') ||
        statusRaw.includes('completed')
      ) {
        return false;
      }

      // Nếu có định dạng 10/10, 16/16 -> Đã hoàn thành (false)
      const slashMatch = epRaw.match(/(\d+)\s*\/\s*(\d+)/);
      if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[1] === slashMatch[2]) {
        return false;
      }

      // Các trường hợp còn lại (Tập 1, Tập 7, Đang chiếu...) -> Đang cập nhật (true)
      return true;
    };

    const parseDate = (item: any) => {
      const dateStr = item?.modified || item?.updated || item?.created || '';
      const time = new Date(dateStr).getTime();
      return isNaN(time) ? 0 : time;
    };

    // SẮP XẾP: Đang cập nhật lên đầu -> Sau đó xếp theo ngày cập nhật mới nhất
    blMovies.sort((a: any, b: any) => {
      const isOngoingA = checkIsOngoing(a);
      const isOngoingB = checkIsOngoing(b);

      if (isOngoingA && !isOngoingB) return -1; // a đang chiếu -> đưa lên trước
      if (!isOngoingA && isOngoingB) return 1;  // b đang chiếu -> đưa lên trước

      // Cùng trạng thái thì phim nào mới cập nhật hơn sẽ xếp trước
      return parseDate(b) - parseDate(a);
    });

    return {
      status: 'success',
      items: blMovies,
      paginate: {
        current_page: page,
        total_page: 1,
        total_items: blMovies.length,
        items_per_page: Math.max(blMovies.length, 24),
      },
    };
  } catch (error) {
    console.error('Lỗi tải danh sách Đam Mỹ từ Google Sheets:', error);
    return { 
      status: 'error', 
      items: [], 
      paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 24 } 
    };
  }
}
