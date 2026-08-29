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

const cache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL = 3 * 60 * 1000;
const MOVIES_PER_PAGE_TARGET = 60;
const API_PAGE_CHUNK = 6;

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

async function fetchCategoryWith60Limit(
  urlBuilder: (apiPage: number) => string,
  userPage: number = 1
): Promise<ApiResponseList> {
  const startApiPage = (userPage - 1) * API_PAGE_CHUNK + 1;

  try {
    const firstPath = urlBuilder(startApiPage);
    const firstRes = await fetchApiEndpoint<ApiResponseList>(firstPath).catch((err) => {
      console.warn(`Lỗi khi tải trang đầu ${startApiPage}:`, err);
      return null;
    });

    if (!firstRes || !firstRes.items || firstRes.items.length === 0) {
      return {
        status: 'error',
        items: [],
        paginate: { current_page: userPage, total_page: 1, total_items: 0, items_per_page: MOVIES_PER_PAGE_TARGET },
      };
    }

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

    return {
      status: 'success',
      cat: firstRes.cat,
      paginate: {
        current_page: userPage,
        total_page: Math.max(1, Math.ceil(totalItems / MOVIES_PER_PAGE_TARGET)),
        total_items: totalItems,
        items_per_page: mergedItems.length,
      },
      items: mergedItems,
    };
  } catch (error) {
    return {
      status: 'error',
      items: [],
      paginate: { current_page: userPage, total_page: 1, total_items: 0, items_per_page: MOVIES_PER_PAGE_TARGET },
    };
  }
}

export async function getNewMovies(page = 1): Promise<ApiResponseList> {
  return fetchCategoryWith60Limit((p) => `films/phim-moi-cap-nhat?page=${p}`, page);
}

export async function getMoviesByType(typeSlug: string, page = 1): Promise<ApiResponseList> {
  if (typeSlug === 'phim-moi-cap-nhat') return getNewMovies(page);
  return fetchCategoryWith60Limit((p) => `films/danh-sach/${typeSlug}?page=${p}`, page);
}

export async function getMoviesByGenre(genreSlug: string, page = 1): Promise<ApiResponseList> {
  // GỌI HÀM SHEET KHI CHỌN ĐAM MỸ Ở ĐÂY
  if (genreSlug === 'dam-my') {
    return getBLMoviesFromSheet(page);
  }
  return fetchCategoryWith60Limit((p) => `films/the-loai/${genreSlug}?page=${p}`, page);
}

export async function getMoviesByCountry(countrySlug: string, page = 1): Promise<ApiResponseList> {
  return fetchCategoryWith60Limit((p) => `films/quoc-gia/${countrySlug}?page=${p}`, page);
}

export async function searchMovies(keyword: string, page = 1): Promise<ApiResponseList> {
  const encoded = encodeURIComponent(keyword.trim());
  return fetchCategoryWith60Limit((p) => `films/search?keyword=${encoded}&page=${p}`, page);
}

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

export async function getMovieDetail(slug: string): Promise<MovieDetail> {
  const data = await fetchApiEndpoint<ApiResponseDetail>(`film/${slug}`);
  if (data.status === 'success' && data.movie) {
    return data.movie;
  }
  throw new Error(data.msg || 'Không thể tải thông tin phim');
}

export async function getMoviesForRow(
  slug: string,
  type: 'type' | 'genre' | 'country' = 'type',
  targetCount = 30
): Promise<MovieItem[]> {
  try {
    // CHUYỂN HƯỚNG TRANG CHỦ SANG SHEET
    if (type === 'genre' && slug === 'dam-my') {
      const blRes = await getBLMoviesFromSheet(1);
      return (blRes.items || []).slice(0, targetCount);
    }

    const getPath = (p: number) => {
      if (type === 'type') return slug === 'phim-moi-cap-nhat' ? `films/phim-moi-cap-nhat?page=${p}` : `films/danh-sach/${slug}?page=${p}`;
      if (type === 'genre') return `films/the-loai/${slug}?page=${p}`;
      return `films/quoc-gia/${slug}?page=${p}`;
    };

    const firstRes = await fetchApiEndpoint<ApiResponseList>(getPath(1)).catch(() => null);
    if (!firstRes || !firstRes.items || firstRes.items.length === 0) return [];

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
    return [];
  }
}

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGYPjV2eNr_elQre2K5yGiWlcfAvR1r6Sp46YfWT0Sccw0xQYNDvxCBotnX9JlUX0YkBNvycXIfCwi/pub?gid=0&single=true&output=csv';

export async function getBLMoviesFromSheet(page: number = 1): Promise<ApiResponseList> {
  try {
    const sheetRes = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
    if (!sheetRes.ok) throw new Error('Lỗi tải Sheet');

    const csvText = await sheetRes.text();

    const rawLines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^"|"$/g, ''))
      .filter((line) => line.length > 3 && !line.toLowerCase().startsWith('tên phim') && !line.toLowerCase().startsWith('stt'));

    if (rawLines.length === 0) {
      return { status: 'success', items: [], paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 24 } };
    }

    const moviePromises = rawLines.map(async (item) => {
      let slug = item;
      if (slug.includes('/film/')) slug = slug.split('/film/')[1].split('?')[0].replace(/\/$/, '');
      else if (slug.includes('/phim/')) slug = slug.split('/phim/')[1].split('?')[0].replace(/\/$/, '');
      else if (slug.includes('/')) slug = slug.substring(slug.lastIndexOf('/') + 1);

      slug = slug.trim().toLowerCase();
      if (!slug) return null;

      try {
        const detail = await getMovieDetail(slug);
        if (!detail) return null;

        const itemObj: MovieItem = {
          id: (detail as any).id || detail.slug,
          name: detail.name,
          slug: detail.slug,
          original_name: detail.original_name || '',
          thumb_url: detail.thumb_url || detail.poster_url || '',
          poster_url: detail.poster_url || detail.thumb_url || '',
          current_episode: detail.current_episode || '',
          total_episodes: detail.total_episodes || 0,
          time: detail.time || '',
          quality: detail.quality || 'HD',
          language: detail.language || 'Vietsub',
          description: detail.description || '',
          modified: (detail as any).modified || (detail as any).created || ''
        };
        return itemObj;
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(moviePromises);
    const blMovies: MovieItem[] = results.filter((m): m is MovieItem => m !== null);

    const checkIsOngoing = (movie: any): boolean => {
      const epRaw = (movie?.current_episode || '').trim().toLowerCase();
      if (epRaw.includes('full') || epRaw.includes('hoàn tất') || epRaw.includes('hoàn thành') || epRaw.includes('trọn bộ') || epRaw.includes('end') || epRaw.includes('đã kết thúc')) return false;
      const slashMatch = epRaw.match(/(\d+)\s*\/\s*(\d+)/);
      if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[1] === slashMatch[2]) return false;
      return true;
    };

    const parseDate = (item: any) => {
      const time = new Date(item?.modified || item?.updated || item?.created || '').getTime();
      return isNaN(time) ? 0 : time;
    };

    blMovies.sort((a: any, b: any) => {
      const isOngoingA = checkIsOngoing(a);
      const isOngoingB = checkIsOngoing(b);
      if (isOngoingA && !isOngoingB) return -1;
      if (!isOngoingA && isOngoingB) return 1;
      return parseDate(b) - parseDate(a);
    });

    return {
      status: 'success',
      items: blMovies,
      paginate: { current_page: page, total_page: 1, total_items: blMovies.length, items_per_page: Math.max(blMovies.length, 24) },
    };
  } catch (error) {
    return { status: 'error', items: [], paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 24 } };
  }
}
