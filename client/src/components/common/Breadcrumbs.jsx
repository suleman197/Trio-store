import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-ink-500 py-4">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={12} className="text-ink-300 shrink-0" />}
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-black transition-colors truncate max-w-[160px]">
                {item.label}
              </Link>
            ) : (
              <span className={`${isLast ? 'text-ink-900 font-medium' : ''} truncate max-w-[220px]`}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
