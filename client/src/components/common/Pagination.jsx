import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page numbers with ellipsis: [1] … [4] [5] [6] … [20]
 */
const pageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;

  const base =
    'inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${base} border-ink-700 text-ink-400 hover:border-gold-500 hover:text-gold-400`}
      >
        <ChevronLeft size={16} />
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1.5 text-ink-500 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${base} ${
              p === page
                ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                : 'border-ink-700 text-ink-400 hover:border-gold-500 hover:text-gold-400'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={`${base} border-ink-700 text-ink-400 hover:border-gold-500 hover:text-gold-400`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
