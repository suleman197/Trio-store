import { Star, StarHalf } from 'lucide-react';

export default function RatingStars({ rating = 0, size = 14, showValue = false, count }) {
  const stars = [1, 2, 3, 4, 5].map((i) => {
    if (rating >= i) return 'full';
    if (rating >= i - 0.5) return 'half';
    return 'empty';
  });

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((type, i) => (
          <span key={i} className="relative inline-flex">
            <Star size={size} className={type === 'empty' ? 'text-ink-700' : 'text-gold-500'} fill={type !== 'empty' ? 'currentColor' : 'none'} />
            {type === 'half' && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star size={size} className="text-gold-500" fill="currentColor" />
              </span>
            )}
          </span>
        ))}
      </div>
      {showValue && <span className="text-xs font-semibold text-white">{Number(rating).toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-ink-400">({count})</span>}
    </div>
  );
}
