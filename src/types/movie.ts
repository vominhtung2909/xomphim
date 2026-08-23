export interface MovieItem {
  id?: string;
  name: string;
  slug: string;
  original_name?: string;
  thumb_url: string;
  poster_url: string;
  created?: string;
  modified?: string;
  description?: string;
  total_episodes?: number | string;
  current_episode?: string;
  time?: string;
  quality?: string;
  language?: string;
  director?: string | null;
  casts?: string | null;
  category?: Record<string, CategoryGroup>;
}

export interface CategoryGroup {
  group: {
    id: string;
    name: string;
  };
  list: CategoryItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface EpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8?: string;
}

export interface EpisodeServer {
  server_name: string;
  items: EpisodeItem[];
}

export interface MovieDetail extends MovieItem {
  episodes: EpisodeServer[];
}

export interface PaginateInfo {
  current_page: number;
  total_page: number;
  total_items: number;
  items_per_page: number;
}

export interface ApiResponseList {
  status: string;
  paginate?: PaginateInfo;
  cat?: {
    name: string;
    title: string;
    slug: string;
  };
  items: MovieItem[];
}

export interface ApiResponseDetail {
  status: string;
  movie: MovieDetail;
  msg?: string;
}

export interface WatchHistoryItem {
  slug: string;
  name: string;
  poster_url: string;
  thumb_url?: string;
  serverIndex: number;
  serverName: string;
  episodeIndex: number;
  episodeName: string;
  episodeSlug: string;
  timestamp: number;
  quality?: string;
  current_episode?: string;
}

export interface BookmarkItem {
  slug: string;
  name: string;
  poster_url: string;
  thumb_url?: string;
  original_name?: string;
  quality?: string;
  current_episode?: string;
  addedAt: number;
}

export type ViewMode = 'home' | 'watch' | 'search' | 'list' | 'favorites' | 'history' | 'source_code';

export interface CategoryOption {
  name: string;
  slug: string;
}
