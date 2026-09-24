import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, discountPercent, effectivePrice } from '../../utils/format';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import RatingStars from '../common/RatingStars';
import { StockBadge } from '../common/Badges';

export default function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.has(product._id));

  const price = effectivePrice(product);
  const off = discountPercent(product.price, product.discountPrice);
  const outOfStock = product.stock <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addToCart(product, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    try {
      const added = await toggleWishlist(product);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group card-img-zoom flex flex-col bg-[#111] border border-ink-800 rounded-xl overflow-hidden
        hover:shadow-xl hover:shadow-gold-500/5 hover:-translate-y-0.5 transition-all duration-300 w-full min-w-0"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-900 w-full">
        <img
          src={product.images?.[0] || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.opacity = '0')}
        />
        {off > 0 && (
          <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-gold-500 text-black text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:py-1 rounded-md tracking-wide">
            -{off}%
          </span>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border backdrop-blur
            transition-all duration-200 active:scale-90
            ${wishlisted ? 'bg-gold-500 text-black border-gold-500' : 'bg-[#111]/80 text-ink-500 border-ink-700 hover:border-gold-500 hover:text-gold-400'}`}
        >
          <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {outOfStock && (
          <div className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg uppercase tracking-wider text-center">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 min-w-0">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gold-400 truncate">{product.brand}</p>
        <h3 className="mt-1 text-xs sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-gold-400 transition-colors break-words">
          {product.name}
        </h3>

        <div className="mt-1.5">
          <RatingStars rating={product.rating} count={product.reviewCount} size={11} />
        </div>

        <div className="mt-auto pt-3 flex flex-wrap items-end justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5">
              <span className="text-sm sm:text-base font-bold tracking-tight text-gold-400 whitespace-nowrap">{formatCurrency(price)}</span>
              {off > 0 && <span className="text-[10px] sm:text-xs text-ink-400 line-through whitespace-nowrap">{formatCurrency(product.price)}</span>}
            </div>
            <StockBadge stock={product.stock} threshold={product.lowStockThreshold ?? 5} />
          </div>
          {!outOfStock && (
            <button
              onClick={handleAdd}
              aria-label="Add to cart"
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gold-500 text-black flex items-center justify-center
                hover:bg-gold-400 active:scale-90 transition-all duration-200"
            >
              <ShoppingBag size={15} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
