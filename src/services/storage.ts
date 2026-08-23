import { BookmarkItem, MovieDetail, MovieItem, WatchHistoryItem } from '../types/movie';

const BOOKMARKS_KEY = 'cineflix_bookmarks_v1';
const HISTORY_KEY = 'cineflix_history_v1';

export function getBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading bookmarks', e);
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  const list = getBookmarks();
  return list.some((item) => item.slug === slug);
}

export function toggleBookmark(movie: MovieItem | MovieDetail): boolean {
  try {
    const list = getBookmarks();
    const index = list.findIndex((item) => item.slug === movie.slug);
    let newState = false;
    if (index >= 0) {
      list.splice(index, 1);
      newState = false;
    } else {
      const poster = movie.thumb_url || movie.poster_url;
      list.unshift({
        slug: movie.slug,
        name: movie.name,
        poster_url: poster,
        thumb_url: poster,
        original_name: movie.original_name,
        quality: movie.quality,
        current_episode: movie.current_episode,
        addedAt: Date.now(),
      });
      newState = true;
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    return newState;
  } catch (e) {
    console.error('Error toggling bookmark', e);
    return false;
  }
}

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading watch history', e);
    return [];
  }
}

export function saveWatchProgress(
  movie: MovieDetail | MovieItem,
  serverIndex: number,
  serverName: string,
  episodeIndex: number,
  episodeName: string,
  episodeSlug: string
): void {
  try {
    const list = getWatchHistory();
    const filtered = list.filter((item) => item.slug !== movie.slug);
    const poster = movie.thumb_url || movie.poster_url;
    const item: WatchHistoryItem = {
      slug: movie.slug,
      name: movie.name,
      poster_url: poster,
      thumb_url: poster,
      serverIndex,
      serverName,
      episodeIndex,
      episodeName,
      episodeSlug,
      timestamp: Date.now(),
      quality: movie.quality,
      current_episode: movie.current_episode,
    };
    filtered.unshift(item);
    // Keep maximum 30 items
    const limited = filtered.slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('Error saving watch history', e);
  }
}

export function removeWatchHistoryItem(slug: string): void {
  try {
    const list = getWatchHistory().filter((item) => item.slug !== slug);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error removing watch history item', e);
  }
}

export function clearWatchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing history', e);
  }
}

export function clearAllBookmarks(): void {
  try {
    localStorage.removeItem(BOOKMARKS_KEY);
  } catch (e) {
    console.error('Error clearing bookmarks', e);
  }
}
