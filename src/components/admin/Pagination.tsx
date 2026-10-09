import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, totalItems, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right);

  if (totalItems <= pageSize) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-stone-500">Showing {start}–{end} of {totalItems}</p>
      <nav aria-label="Table pagination" className="flex items-center gap-1.5">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-700 disabled:opacity-40">Previous</button>
        {pages.map((pageNumber, index) => (
          <React.Fragment key={pageNumber}>
            {index > 0 && pages[index - 1] !== pageNumber - 1 && <span className="px-1 text-xs text-stone-400">…</span>}
            <button type="button" aria-current={currentPage === pageNumber ? 'page' : undefined} onClick={() => onPageChange(pageNumber)} className={`min-w-8 rounded-lg border px-2 py-1.5 text-xs ${currentPage === pageNumber ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700 hover:bg-stone-50'}`}>{pageNumber}</button>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-700 disabled:opacity-40">Next</button>
      </nav>
    </div>
  );
};
