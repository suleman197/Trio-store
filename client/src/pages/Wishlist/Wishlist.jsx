import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Zap, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import RatingStars from '../../components/common/RatingStars';
import { formatCurrency, effectivePrice, discountPercent } from '../../utils/format';

export default function Wishlist() {
  const navigate = useNavigate();
  const products = useWishlistStore((s) => s.products);
  const toggle = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.addItem);
  const buyNowItem = useCartStore((s) => s.buyNowItem);
  const user = useAuthStore((s) => s.user);

  const handleAddToCart = async (p) => {
    try {
      await addToCart(p, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBuyNow = async (p) => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }
    try {
      await buyNowItem(p, 1);
      navigate('/checkout');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 pb-16 min-w-0 overflow-x-hidden">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8 text-white">My Wishlist</h1>

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          action={
            <Link to="/shop" className="bg-gold-500 text-black px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors">
              Explore Products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
          {products.map((p) => {
            const price = effectivePrice(p);
            const off = discountPercent(p.price, p.discountPrice);
            const outOfStock = p.stock <= 0;
            return (
              <div key={p._id} className="flex flex-col xs:flex-row gap-3 sm:gap-4 border border-ink-800 rounded-xl p-3.5 sm:p-4 bg-[#111] hover:border-gold-500/30 transition-all w-full min-w-0">
                <Link to={`/product/${p.slug}`} className="shrink-0 self-center xs:self-start">
                  <img
                    src={p.images?.[0]}
                    alt={p.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover bg-ink-900 border border-ink-800"
                    onError={(e) => (e.currentTarget.style.opacity = '0.25')}
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gold-500 truncate">{p.brand}</p>
                      <Link to={`/product/${p.slug}`} className="font-semibold text-xs sm:text-sm line-clamp-2 hover:text-gold-400 mt-0.5 block text-white break-words">
                        {p.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => toggle(p)}
                      aria-label="Remove from wishlist"
                      className="p-1 h-fit rounded text-ink-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <RatingStars rating={p.rating} count={p.reviewCount} size={11} />
                  <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm sm:text-base text-white">{formatCurrency(price)}</span>
                      {off > 0 && <span className="ml-1.5 text-xs text-ink-500 line-through">{formatCurrency(p.price)}</span>}
                      <p className={`text-[10px] font-bold uppercase ${outOfStock ? 'text-red-500' : p.stock <= (p.lowStockThreshold ?? 5) ? 'text-gold-500' : 'text-emerald-500'}`}>
                        {outOfStock ? 'Out of Stock' : p.stock <= (p.lowStockThreshold ?? 5) ? `Only ${p.stock} left` : 'In Stock'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleBuyNow(p)}
                        disabled={outOfStock}
                        className="shrink-0 inline-flex items-center gap-1 bg-gold-500 text-black px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-gold-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        <Zap size={13} /> Buy Now
                      </button>
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={outOfStock}
                        className="shrink-0 inline-flex items-center gap-1 border border-ink-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:border-gold-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <ShoppingBag size={13} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
