import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginateInfo } from '../types/movie';

interface PaginationProps {
  paginate: PaginateInfo;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ paginate, onPageChange }) => {
  const [jumpPage, setJumpPage] = useState('');
  const { current_page, total_page } = paginate;

  if (total_page <= 1) return null;

  // Generate page numbers with smart sliding window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Show 2 pages before and after current

    const left = Math.max(1, current_page - delta);
    const right = Math.min(total_page, current_page + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < total_page) {
      if (right < total_page - 1) pages.push('...');
      pages.push(total_page);
    }

    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= total_page) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
      {/* Page Info */}
      <span className="text-xs sm:text-sm text-slate-400 font-medium">
        Trang <strong className="text-purple-400 font-bold">{current_page}</strong> /{' '}
        <strong className="text-white">{total_page}</strong> ({paginate.total_items.toLocaleString()} phim)
      </span>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={current_page <= 1}
          title="Trang đầu"
          className="p-2 rounded-xl bg-[#181818] hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          title="Trang trước"
          className="p-2 rounded-xl bg-[#181818] hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-600 text-xs font-mono">
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === current_page;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] h-9 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400 scale-105'
                  : 'bg-[#181818] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= total_page}
          title="Trang kế tiếp"
          className="p-2 rounded-xl bg-[#181818] hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(total_page)}
          disabled={current_page >= total_page}
          title="Trang cuối"
          className="p-2 rounded-xl bg-[#181818] hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jump to page form */}
      <form onSubmit={handleJump} className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-slate-400 hidden lg:inline">Đi tới trang:</span>
        <input
          type="number"
          min={1}
          max={total_page}
          value={jumpPage}
          placeholder="#"
          onChange={(e) => setJumpPage(e.target.value)}
          className="w-16 bg-[#181818] border border-white/10 focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-center text-xs sm:text-sm text-white outline-none"
        />
        <button
          type="submit"
          disabled={!jumpPage}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Đi
        </button>
      </form>
    </div>
  );
};

