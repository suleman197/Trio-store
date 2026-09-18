import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import { productApi, categoryApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { ProductGridSkeleton } from '../../components/common/Skeletons';
import RatingStars from '../../components/common/RatingStars';
import { SORT_OPTIONS } from '../../utils/format';

const PRICE_PRESETS = [
  ['', '', 'All Prices'],
  ['0', '100', 'Under $100'],
  ['100', '500', '$100 – $500'],
  ['500', '1000', '$500 – $1,000'],
  ['1000', '', 'Over $1,000'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const brands = params.get('brand')?.split(',').filter(Boolean) || [];
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const rating = params.get('rating') || '';
  const inStock = params.get('inStock') === 'true';
  const sort = params.get('sort') || 'newest';
  const discounted = params.get('discounted') === 'true';
  const page = parseInt(params.get('page'), 10) || 1;

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
    setFiltersOpen(false);
  };

  const toggleBrand = (brand) => {
    const next = brands.includes(brand) ? brands.filter((b) => b !== brand) : [...brands, brand];
    setParam('brand', next.join(','));
  };

  const queryParams = useMemo(() => {
    const q = { page, limit: 12, sort };
    if (search) q.search = search;
    if (category) q.category = category;
    if (brands.length) q.brand = brands.join(',');
    if (minPrice) q.minPrice = minPrice;
    if (maxPrice) q.maxPrice = maxPrice;
    if (rating) q.rating = rating;
    if (inStock) q.inStock = 'true';
    return q;
  }, [page, sort, search, category, brands.join(','), minPrice, maxPrice, rating, inStock]);

  const products = useFetch(() => productApi.list(queryParams), [JSON.stringify(queryParams)]);
  const categories = useFetch(() => categoryApi.list(), []);

  let items = products.data?.products || [];
  if (discounted) items = items.filter((p) => p.discountPrice);

  const activeFilterCount =
    (search ? 1 : 0) + (category ? 1 : 0) + brands.length + (minPrice || maxPrice ? 1 : 0) + (rating ? 1 : 0) + (inStock ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          ...(category ? [{ label: 'Shop', to: '/shop' }, { label: categories.data?.find((c) => c.slug === category)?.name || category }] : [{ label: 'Shop' }]),
        ]}
      />

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ink-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {search ? `Results for "${search}"` : discounted ? 'Deals' : 'All Products'}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{products.data?.meta ? `${products.data.meta.total} products` : 'Loading…'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 border border-ink-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white hover:border-gold-500 transition-colors"
          >
            <SlidersHorizontal size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-gold-500 text-black rounded-full text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="border border-ink-700 bg-[#111] text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[250px_1fr] gap-8 py-8">
        {/* Filters — desktop */}
        <aside className="hidden lg:block">
          <FiltersPanel
            {...{
              category,
              brands,
              minPrice,
              maxPrice,
              rating,
              inStock,
              setParam,
              toggleBrand,
              categories: categories.data || [],
            }}
          />
        </aside>

        {/* Filters — mobile drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-full bg-[#111] overflow-y-auto shadow-2xl animate-[drawerIn_.25s_ease] border-r border-ink-800">
              <style>{`@keyframes drawerIn{from{transform:translateX(-100%)}to{transform:none}}`}</style>
              <div className="sticky top-0 bg-[#111] flex items-center justify-between px-5 h-14 border-b border-ink-800 z-10">
                <span className="font-bold text-white">Filters</span>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="text-white hover:text-gold-500"><X size={20} /></button>
              </div>
              <div className="p-5">
                <FiltersPanel
                  {...{ category, brands, minPrice, maxPrice, rating, inStock, setParam, toggleBrand, categories: categories.data || [] }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div>
          {products.loading ? (
            <ProductGridSkeleton count={9} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              action={
                <button
                  onClick={() => setParams(new URLSearchParams())}
                  className="bg-gold-500 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors"
                >
                  Clear all filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {!discounted && <Pagination meta={products.data?.meta} onPage={(p) => setParam('page', String(p))} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({ category, brands, minPrice, maxPrice, rating, inStock, setParam, toggleBrand, categories }) {
  const availableBrands = useFetch(() => productApi.brands(), []);
  const title = 'text-xs font-bold uppercase tracking-widest text-gold-500 mb-3';

  return (
    <div className="space-y-7 lg:sticky lg:top-28">
      {/* Category */}
      <div>
        <h4 className={title}>Category</h4>
        <div className="space-y-1">
          <FilterRow label="All Categories" checked={!category} onChange={() => setParam('category', '')} radio />
          {(categories || []).map((c) => (
            <FilterRow key={c._id} label={c.name} checked={category === c.slug} onChange={() => setParam('category', c.slug)} radio />
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h4 className={title}>Brand</h4>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {(availableBrands.data || []).map((b) => (
            <FilterRow key={b} label={b} checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className={title}>Price</h4>
        <div className="space-y-1">
          {PRICE_PRESETS.map(([lo, hi, label]) => (
            <FilterRow
              key={label}
              label={label}
              checked={minPrice === lo && maxPrice === hi}
              onChange={() => {
                setParam('minPrice', lo);
                setParam('maxPrice', hi);
              }}
              radio
            />
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className={title}>Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => setParam('rating', rating === String(r) ? '' : String(r))}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-colors ${
                rating === String(r) ? 'bg-ink-800 border border-gold-500' : 'hover:bg-ink-900 border border-transparent'
              }`}
            >
              <RatingStars rating={r} size={13} />
              <span className="text-xs text-ink-400">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className={title}>Availability</h4>
        <FilterRow label="In Stock Only" checked={inStock} onChange={() => setParam('inStock', inStock ? '' : 'true')} />
      </div>
    </div>
  );
}

function FilterRow({ label, checked, onChange, radio }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1">
      <span
        className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-all duration-150 ${
          radio ? 'rounded-full' : 'rounded'
        } ${checked ? 'bg-gold-500 border-gold-500' : 'border-ink-600 group-hover:border-gold-500 bg-[#111]'}`}
      >
        {checked && !radio && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-black stroke-2"><path d="M1 4l3 3 5-6" /></svg>
        )}
        {checked && radio && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
      </span>
      <input type={radio ? 'radio' : 'checkbox'} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`text-sm ${checked ? 'font-semibold text-white' : 'text-ink-400'} group-hover:text-white transition-colors`}>
        {label}
      </span>
    </label>
  );
}
