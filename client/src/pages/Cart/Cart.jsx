import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { couponApi } from '../../services';
import useCartStore from '../../store/cartStore';
import QuantitySelector from '../../components/common/QuantitySelector';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { formatCurrency } from '../../utils/format';

export default function Cart() {
  const { items, subtotal, updateItem, removeItem } = useCartStore();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const navigate = useNavigate();

  const shipping = 0;
  const discount = coupon?.discount ?? 0;
  const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
  const total = Math.round((subtotal - discount + tax) * 100) / 100;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setCheckingCoupon(true);
    try {
      const result = await couponApi.validate(code.trim(), subtotal);
      setCoupon(result);
      toast.success(`Coupon ${result.code} applied — you save ${formatCurrency(result.discount)}`);
    } catch (err) {
      toast.error(err.message);
      setCoupon(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our latest tech and find your next upgrade."
          action={
            <Link to="/shop" className="bg-gold-500 text-black px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors">
              Continue Shopping
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shopping Cart' }]} />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-white">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Items */}
        <div className="border border-ink-800 rounded-2xl divide-y divide-ink-800 overflow-hidden bg-[#111]">
          {items.map((item) => (
            <div key={item._id} className="p-5 flex gap-5">
              <img
                src={item.product?.images?.[0] || item.image}
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-ink-800 bg-ink-900 shrink-0"
                onError={(e) => (e.currentTarget.style.opacity = '0.25')}
              />
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-500">{item.product?.brand || item.brand}</p>
                    <Link to={`/product/${item.product?.slug || item.slug}`} className="font-semibold hover:text-gold-400 line-clamp-2 mt-0.5 block text-white">
                      {item.product?.name || item.name}
                    </Link>
                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <p className="text-xs text-ink-500 mt-1">{Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item._id).catch((e) => toast.error(e.message))}
                    aria-label="Remove"
                    className="p-1.5 h-fit rounded-lg text-ink-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                  <QuantitySelector
                    value={item.quantity}
                    max={item.product?.stock || item.stock || 99}
                    onChange={(q) => updateItem(item._id, q).catch((e) => toast.error(e.message))}
                  />
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency((item.unitPrice ?? item.price) * item.quantity)}</p>
                    {(item.unitPrice ?? item.price) !== item.price && (
                      <p className="text-xs text-ink-500 line-through">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="border border-ink-800 rounded-2xl p-6 lg:sticky lg:top-28 space-y-4 bg-[#111]">
          <h3 className="font-bold text-lg tracking-tight text-white">Order Summary</h3>

          {/* Coupon */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
              <Tag size={13} /> Coupon Code
            </label>
            {coupon ? (
              <div className="flex items-center justify-between bg-ink-900 rounded-lg px-3.5 py-2.5 text-sm border border-ink-800">
                <span className="font-bold text-white">{coupon.code}</span>
                <span className="text-emerald-500 font-semibold">-{formatCurrency(coupon.discount)}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 min-w-0 border border-ink-700 bg-ink-900 text-white rounded-lg px-3.5 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors placeholder:text-ink-600"
                />
                <button
                  onClick={applyCoupon}
                  disabled={checkingCoupon || !code.trim()}
                  className="px-4 rounded-lg border border-gold-500 text-gold-500 font-semibold text-sm hover:bg-gold-500 hover:text-black transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <dl className="space-y-2.5 text-sm border-t border-ink-800 pt-4">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`-${formatCurrency(discount)}`} accent />}
            <Row label="Tax (5%)" value={formatCurrency(tax)} />
            <div className="border-t border-ink-800 pt-3 flex justify-between">
              <dt className="font-bold text-white">Total</dt>
              <dd className="font-extrabold text-lg tracking-tight text-white">{formatCurrency(total)}</dd>
            </div>
          </dl>

          <button
            onClick={() => navigate('/checkout', { state: { coupon } })}
            className="w-full bg-gold-500 text-black py-4 rounded-xl font-semibold text-sm hover:bg-gold-600 transition-all active:scale-[0.98]"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/shop"
            className="block w-full text-center border border-ink-700 py-3.5 rounded-xl font-medium text-sm text-white hover:border-gold-500 transition-colors"
          >
            Continue Shopping
          </Link>
          <p className="text-center text-[11px] text-ink-500 flex items-center justify-center gap-1">
            Secure checkout · <ArrowRight size={11} /> Cash on Delivery available
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, sub, accent }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-400">
        {label} {sub && <span className="text-[11px] text-ink-600">({sub})</span>}
      </dt>
      <dd className={`font-semibold ${accent ? 'text-emerald-500' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
