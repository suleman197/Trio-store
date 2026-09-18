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
        hover:shadow-xl hover:shadow-gold-500/5 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-900">
        <img
          src={product.images?.[0] || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.opacity = '0')}
        />
        {off > 0 && (
          <span className="absolute top-3 left-3 bg-gold-500 text-black text-[11px] font-bold px-2 py-1 rounded-md tracking-wide">
            -{off}%
          </span>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur
            transition-all duration-200 active:scale-90
            ${wishlisted ? 'bg-gold-500 text-black border-gold-500' : 'bg-[#111]/80 text-ink-500 border-ink-700 hover:border-gold-500 hover:text-gold-400'}`}
        >
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {outOfStock && (
          <div className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-4 py-2 rounded-lg uppercase tracking-widest">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">{product.brand}</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2 group-hover:text-gold-400 transition-colors">
          {product.name}
        </h3>

        <div className="mt-1.5">
          <RatingStars rating={product.rating} count={product.reviewCount} size={12} />
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-gold-400">{formatCurrency(price)}</span>
              {off > 0 && <span className="text-xs text-ink-400 line-through">{formatCurrency(product.price)}</span>}
            </div>
            <StockBadge stock={product.stock} threshold={product.lowStockThreshold ?? 5} />
          </div>
          {!outOfStock && (
            <button
              onClick={handleAdd}
              aria-label="Add to cart"
              className="shrink-0 w-9 h-9 rounded-lg bg-gold-500 text-black flex items-center justify-center
                hover:bg-gold-400 active:scale-90 transition-all duration-200"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
