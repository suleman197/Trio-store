import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Heart, ShoppingBag, Zap, Check, Truck, ShieldCheck, RotateCcw,
  ChevronLeft, ChevronRight, PackageSearch,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import { formatCurrency, discountPercent, effectivePrice, formatDate } from '../../utils/format';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import RatingStars from '../../components/common/RatingStars';
import QuantitySelector from '../../components/common/QuantitySelector';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { DetailSkeleton } from '../../components/common/Skeletons';
import ProductCard from '../../components/product/ProductCard';
import ReviewSection from '../../components/product/ReviewSection';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';

const TABS = ['Description', 'Specifications', `Warranty & Shipping`];

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(() => productApi.get(slug), [slug]);
  const product = data?.product;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [slug]);

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState({});
  const [tab, setTab] = useState('Description');
  const addToCart = useCartStore((s) => s.addItem);
  const buyNowItem = useCartStore((s) => s.buyNowItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => (product ? s.has(product._id) : false));
  const user = useAuthStore((s) => s.user);

  const key = product?._id;
  const state = useMemo(() => ({}), [key]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><DetailSkeleton /></div>;
  if (error || !product)
    return (
      <EmptyState
        icon={PackageSearch}
        title="Product not found"
        description="This product may have been removed or is no longer available."
        action={<Button onClick={() => navigate('/shop')}>Back to Shop</Button>}
      />
    );

  const price = effectivePrice(product);
  const off = discountPercent(product.price, product.discountPrice);
  const outOfStock = product.stock <= 0;

  const requireVariant = () => {
    for (const v of product.variations || []) {
      if (!variant[v.name]) {
        toast.error(`Please select ${v.name}`);
        return false;
      }
    }
    return true;
  };

  const handleAdd = async (buyNow = false) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/login');
      return;
    }
    if (!requireVariant()) return;
    try {
      if (buyNow) {
        await buyNowItem(product, qty, variant);
        navigate('/checkout');
      } else {
        await addToCart(product, qty, variant);
        toast.success('Added to cart');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBuyNow = () => handleAdd(true);

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }
    try {
      const added = await toggleWishlist(product);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const images = product.images?.length ? product.images : ['/placeholder.svg'];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(product.category ? [{ label: product.category.name, to: `/shop?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 pb-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-ink-800 bg-[#111]">
            <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
            {off > 0 && (
              <span className="absolute top-4 left-4 bg-gold-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg">
                -{off}% OFF
              </span>
            )}
            {images.length > 1 && (
              <>
                <GalleryNav dir="left" disabled={imgIdx === 0} onClick={() => setImgIdx((i) => Math.max(0, i - 1))} />
                <GalleryNav dir="right" disabled={imgIdx === images.length - 1} onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))} />
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-gold-500' : 'border-ink-800 hover:border-ink-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Link
              to={`/shop?brand=${encodeURIComponent(product.brand)}`}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-500 hover:text-gold-400 transition-colors"
            >
              {product.brand}
            </Link>
            <span className="text-xs text-ink-600">SKU: {product.sku}</span>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-white">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingStars rating={product.rating} size={16} showValue count={product.reviewCount} />
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-white">{formatCurrency(price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-ink-500 line-through mb-0.5">{formatCurrency(product.price)}</span>
                <span className="bg-gold-500 text-black text-xs font-bold px-2 py-1 rounded-md mb-1">Save {off}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`mt-3 text-sm font-semibold ${outOfStock ? 'text-red-500' : product.stock <= (product.lowStockThreshold ?? 5) ? 'text-gold-500' : 'text-emerald-500'}`}>
            {outOfStock ? 'Out of Stock' : product.stock <= (product.lowStockThreshold ?? 5) ? `Hurry — only ${product.stock} left in stock` : `In stock — ${product.stock} available`}
          </p>

          <p className="mt-4 text-sm text-ink-400 leading-relaxed">{product.shortDescription}</p>

          {/* Variations */}
          {(product.variations || []).map((v) => (
            <div key={v.name} className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2.5">
                {v.name}: <span className="text-white normal-case tracking-normal">{variant[v.name] || 'Select…'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => {
                  const selected = variant[v.name] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setVariant((prev) => ({ ...prev, [v.name]: opt }))}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 active:scale-95 ${
                        selected
                          ? 'bg-gold-500 text-black border-gold-500'
                          : 'bg-[#111] border-ink-700 text-white hover:border-gold-500'
                      }`}
                    >
                      {selected && <Check size={13} className="inline mr-1.5 -mt-0.5" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Qty + CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!outOfStock && <QuantitySelector value={qty} onChange={(q) => setQty(Math.min(q, product.stock))} max={Math.max(1, Math.min(product.stock, 10))} />}
            <Button size="lg" icon={ShoppingBag} disabled={outOfStock} loading={false} onClick={() => handleAdd(false)} className="flex-1 min-w-[180px]">
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button size="lg" variant="secondary" icon={Zap} disabled={outOfStock} onClick={handleBuyNow}>
              Buy Now
            </Button>
            <Button size="lg" variant="secondary" icon={<Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} />} onClick={handleWishlist}>
              {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </Button>
          </div>

          {/* Perks */}
          <div className="mt-8 flex items-center gap-6 border-t border-ink-800 pt-6">
            {[
              [Truck, 'Free Shipping', 'On all available products'],
            ].map(([Icon, t, s]) => (
              <div key={t} className="flex items-start gap-2.5">
                <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-gold-500" />
                <div>
                  <p className="text-xs font-bold text-white">{t}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{s}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          {product.features?.length > 0 && (
            <ul className="mt-7 space-y-2 border border-ink-800 rounded-xl p-5 bg-ink-900/30">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-300">
                  <Check size={15} className="mt-0.5 shrink-0 text-gold-500" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-ink-800 pt-8 pb-14">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? 'border-gold-500 text-white' : 'border-transparent text-ink-500 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-7 max-w-3xl">
          {tab === 'Description' && <p className="text-sm leading-relaxed text-ink-300 whitespace-pre-line">{product.description}</p>}

          {tab === 'Specifications' && (
            <dl className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden">
              {(product.specifications || []).map((s, i) => (
                <div key={i} className={`grid grid-cols-[140px_1fr] sm:grid-cols-[200px_1fr] ${i % 2 ? 'bg-ink-900/30' : ''}`}>
                  <dt className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-500">{s.key}</dt>
                  <dd className="px-4 py-3 text-sm font-medium text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {(tab === 'Warranty & Shipping') && (
            <div className="space-y-5 text-sm leading-relaxed text-ink-300">
              <div>
                <h4 className="font-bold mb-1 text-white">Warranty</h4>
                <p>{product.warranty || 'Standard manufacturer warranty applies.'}</p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-white">Shipping</h4>
                <p>{product.shippingInfo || 'Ships within 2 business days.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product._id} canReview={!!user} />

      {/* Related */}
      {data.related?.length > 0 && (
        <section className="pb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-7 text-white">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {data.related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GalleryNav({ dir, onClick, disabled }) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? 'Previous image' : 'Next image'}
      className={`absolute ${dir === 'left' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 backdrop-blur
        flex items-center justify-center shadow-md transition-all hover:bg-gold-500 hover:text-black active:scale-90 disabled:opacity-0 text-white`}
    >
      <Icon size={17} />
    </button>
  );
}

void formatDate;
