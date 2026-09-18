export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0));

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const discountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const effectivePrice = (p) =>
  p?.discountPrice && p.discountPrice < p.price ? p.discountPrice : p?.price ?? 0;

export const truncate = (str, n = 60) => (str?.length > n ? `${str.slice(0, n)}…` : str);

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', step: 0 },
  confirmed: { label: 'Confirmed', step: 1 },
  processing: { label: 'Processing', step: 2 },
  shipped: { label: 'Shipped', step: 3 },
  delivered: { label: 'Delivered', step: 4 },
  cancelled: { label: 'Cancelled', step: -1 },
};

export const STOCK_STATUS = {
  in_stock: { label: 'In Stock', tone: 'text-ink-600 bg-ink-100' },
  low_stock: { label: 'Low Stock', tone: 'bg-ink-800 text-white' },
  out_of_stock: { label: 'Out of Stock', tone: 'bg-ink-950 text-white' },
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];
