import React, { useState, useEffect } from 'react';
import { Bookmark, History, Trash2, Play, X, Clock, AlertCircle, Check } from 'lucide-react';
import { BookmarkItem, WatchHistoryItem } from '../types/movie';
import {
  clearWatchHistory,
  clearAllBookmarks,
  removeWatchHistoryItem,
  toggleBookmark,
} from '../services/storage';

interface FavoritesHistoryModalProps {
  isOpen: boolean;
  initialTab?: 'favorites' | 'history';
  bookmarks: BookmarkItem[];
  history: WatchHistoryItem[];
  onClose: () => void;
  onSelectMovie: (slug: string) => void;
  onRefreshData: () => void;
}

export const FavoritesHistoryModal: React.FC<FavoritesHistoryModalProps> = ({
  isOpen,
  initialTab = 'favorites',
  bookmarks,
  history,
  onClose,
  onSelectMovie,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>(initialTab);
  const [localBookmarks, setLocalBookmarks] = useState<BookmarkItem[]>(bookmarks || []);
  const [localHistory, setLocalHistory] = useState<WatchHistoryItem[]>(history || []);
  const [isConfirmingClearHistory, setIsConfirmingClearHistory] = useState(false);
  const [isConfirmingClearBookmarks, setIsConfirmingClearBookmarks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsConfirmingClearHistory(false);
      setIsConfirmingClearBookmarks(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    setLocalBookmarks(bookmarks || []);
  }, [bookmarks]);

  useEffect(() => {
    setLocalHistory(history || []);
  }, [history]);

  if (!isOpen) return null;

  const handleRemoveBookmark = (e: React.MouseEvent, item: BookmarkItem) => {
    e.stopPropagation();
    toggleBookmark({
      slug: item.slug,
      name: item.name,
      thumb_url: item.poster_url,
      poster_url: item.poster_url,
    });
    setLocalBookmarks((prev) => prev.filter((b) => b.slug !== item.slug));
    onRefreshData();
  };

  const handleClearAllBookmarks = () => {
    clearAllBookmarks();
    setLocalBookmarks([]);
    setIsConfirmingClearBookmarks(false);
    onRefreshData();
  };

  const handleRemoveHistory = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    removeWatchHistoryItem(slug);
    setLocalHistory((prev) => prev.filter((h) => h.slug !== slug));
    onRefreshData();
  };

  const handleClearAllHistory = () => {
    clearWatchHistory();
    setLocalHistory([]);
    setIsConfirmingClearHistory(false);
    onRefreshData();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#111111] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveTab('favorites');
                setIsConfirmingClearHistory(false);
                setIsConfirmingClearBookmarks(false);
              }}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Phim Yêu Thích ({localBookmarks.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setIsConfirmingClearHistory(false);
                setIsConfirmingClearBookmarks(false);
              }}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch Sử Xem ({localHistory.length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {localBookmarks.length > 0 && (
                <div className="flex justify-end">
                  {isConfirmingClearBookmarks ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="text-pink-200 font-medium hidden sm:inline">
                        Xóa tất cả phim yêu thích?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleClearAllBookmarks}
                          className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Xóa hết
                        </button>
                        <button
                          onClick={() => setIsConfirmingClearBookmarks(false)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingClearBookmarks(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa tất cả yêu thích
                    </button>
                  )}
                </div>
              )}

              {localBookmarks.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <Bookmark className="w-7 h-7 text-pink-400" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Chưa có phim yêu thích</h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                    Nhấn vào biểu tượng bookmark trên poster phim để lưu các bộ phim bạn muốn xem lại sau.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {localBookmarks.map((item) => (
                    <div
                      key={item.slug}
                      onClick={() => {
                        onClose();
                        onSelectMovie(item.slug);
                      }}
                      className="group relative rounded-xl overflow-hidden bg-[#181818] border border-white/10 hover:border-pink-500 transition-all cursor-pointer flex flex-col hover:scale-102 duration-200"
                    >
                      <div className="poster-container aspect-[2/3] w-full relative bg-[#0e0e0e] rounded-t-xl overflow-hidden">
                        <img
                          src={item.thumb_url || item.poster_url}
                          alt={item.name}
                          className="w-full h-full object-cover object-center rounded-t-xl group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/300x450/181818/ffffff?text=Xóm+Phim';
                          }}
                        />
                        <button
                          onClick={(e) => handleRemoveBookmark(e, item)}
                          title="Xóa khỏi yêu thích"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-pink-400 hover:text-white hover:bg-pink-600 transition-colors cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-400 truncate">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.current_episode || item.quality || 'HD'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {localHistory.length > 0 && (
                <div className="flex justify-end">
                  {isConfirmingClearHistory ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="text-pink-200 font-medium hidden sm:inline">
                        Xác nhận xóa toàn bộ lịch sử xem phim?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleClearAllHistory}
                          className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          Xóa hết
                        </button>
                        <button
                          onClick={() => setIsConfirmingClearHistory(false)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingClearHistory(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa tất cả lịch sử
                    </button>
                  )}
                </div>
              )}

              {localHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <History className="w-7 h-7 text-purple-400" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Lịch sử xem phim trống</h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                    Các tập phim bạn đang xem dở sẽ tự động được ghi nhớ để bạn dễ dàng tiếp tục theo dõi bất cứ lúc nào.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {localHistory.map((item) => (
                    <div
                      key={item.slug}
                      onClick={() => {
                        onClose();
                        onSelectMovie(item.slug);
                      }}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-white/5 px-3 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={item.thumb_url || item.poster_url}
                          alt={item.name}
                          className="w-12 h-16 object-cover object-center rounded-lg shrink-0 bg-[#0e0e0e]"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/100x140/181818/ffffff?text=Xóm+Phim';
                          }}
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-400 truncate">
                            {item.name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                              Đang xem: Tập {item.episodeName}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({item.serverName})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(item.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md group-hover:scale-105 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span className="hidden sm:inline">Xem tiếp</span>
                        </button>
                        <button
                          onClick={(e) => handleRemoveHistory(e, item.slug)}
                          title="Xóa mục này"
                          className="p-2 rounded-xl text-slate-500 hover:text-pink-400 hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

