export function Badge({ children, tone = 'light', className = '' }) {
  const tones = {
    light: 'bg-ink-900 text-ink-300 border-ink-700',
    dark: 'bg-gold-500 text-black border-gold-500',
    outline: 'bg-transparent text-gold-400 border-gold-500/40',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_MAP = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  confirmed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  processing: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  shipped: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  delivered: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
  paid: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  failed: 'border-red-500/30 bg-red-500/10 text-red-400',
  refunded: 'border-ink-600 bg-ink-900 text-ink-400',
};

export function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
        STATUS_MAP[status] || 'border-ink-700 bg-ink-900 text-ink-400'
      } ${className}`}
    >
      {status}
    </span>
  );
}

export const OrderStatusBadge = StatusBadge;

export function StockBadge({ stock, threshold = 5 }) {
  if (stock <= 0)
    return <span className="text-[11px] font-semibold uppercase text-red-400">Out of Stock</span>;
  if (stock <= threshold)
    return <span className="text-[11px] font-semibold uppercase text-gold-400">Only {stock} left</span>;
  return <span className="text-[11px] font-medium text-ink-500">In Stock</span>;
}

/** Inventory-specific tri-state badge */
export function InventoryStatusBadge({ stockStatus }) {
  const map = {
    in_stock: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    low_stock: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    out_of_stock: 'border-red-500/30 bg-red-500/10 text-red-400',
  };
  const labels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
        map[stockStatus] || map.in_stock
      }`}
    >
      {labels[stockStatus] || stockStatus}
    </span>
  );
}
