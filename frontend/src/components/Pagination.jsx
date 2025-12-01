import React from 'react';

export default function Pagination({ current = 1, totalPages = 1, onChange = () => {} }) {
  const canPrev = current > 1;
  const canNext = current < totalPages;

  // Build simple page list. If too many pages, show a compact window around current.
  const buildPages = () => {
    const pages = [];
    const maxButtons = 7; // total numeric buttons to show
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const windowSize = 5; // pages around current
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - windowSize + 1;
    }
    // Always include first and last if outside window
    if (start > 1) pages.push(1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push(totalPages);
    // De-duplicate if overlaps
    return [...new Set(pages)];
  };

  const pages = buildPages();

  return (
    <div className="flex items-center gap-2">
      {/* Prev */}
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => canPrev && onChange(current - 1)}
        disabled={!canPrev}
        className={`px-3 py-2 rounded-md text-sm font-medium border ${
          canPrev
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
      >
        <span aria-hidden>‹</span>
      </button>

      {/* Pages */}
      {pages.map((p, idx) => {
        // Insert ellipsis if large gaps
        const prev = pages[idx - 1];
        const needEllipsis = idx > 0 && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {needEllipsis && (
              <span className="px-2 text-gray-400 select-none">…</span>
            )}
            <button
              type="button"
              onClick={() => onChange(p)}
              className={`px-3 py-2 rounded-md text-sm font-medium border ${
                current === p
                  ? 'bg-cyan-400 text-white border-cyan-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      {/* Next */}
      <button
        type="button"
        aria-label="Next page"
        onClick={() => canNext && onChange(current + 1)}
        disabled={!canNext}
        className={`px-3 py-2 rounded-md text-sm font-medium border ${
          canNext
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}

