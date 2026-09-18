import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';
import QuantitySelector from '../common/QuantitySelector';

export default function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const setOpen = useCartStore((s) => s.setDrawerOpen);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();

  if (!open) return null;

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] flex flex-col shadow-2xl animate-[slideIn_.25s_ease] border-l border-ink-800">
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}`}</style>

        <div className="flex items-center justify-between px-6 h-16 border-b border-ink-800">
          <h3 className="font-bold tracking-tight text-white">Your Cart ({items.length})</h3>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="p-2 hover:bg-ink-800 rounded-lg transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-lg font-semibold text-white">Your cart is empty</p>
            <p className="text-sm text-ink-500">Browse the store and find something you love.</p>
            <button onClick={() => go('/shop')} className="bg-gold-500 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gold-400 transition-colors">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-ink-800">
              {items.map((item) => (
                <div key={item._id} className="py-4 flex gap-4">
                  <img
                    src={item.product?.images?.[0] || item.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-ink-800 bg-ink-900 shrink-0"
                    onError={(e) => (e.currentTarget.style.opacity = '0.2')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Link to={`/product/${item.product?.slug || item.slug}`} onClick={() => setOpen(false)} className="text-sm font-semibold line-clamp-2 hover:text-gold-400 text-white">
                        {item.product?.name || item.name}
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await removeItem(item._id);
                          } catch (err) {
                            toast.error(err.message);
                          }
                        }}
                        aria-label="Remove item"
                        className="text-ink-400 hover:text-red-400 transition-colors p-1 h-fit"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <p className="text-xs text-ink-500 mt-0.5">
                        {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <QuantitySelector
                        size="sm"
                        value={item.quantity}
                        max={item.product?.stock ?? item.stock ?? 99}
                        onChange={async (q) => {
                          try {
                            await updateItem(item._id, q);
                          } catch (err) {
                            toast.error(err.message);
                          }
                        }}
                      />
                      <span className="text-sm font-bold text-gold-400">{formatCurrency((item.unitPrice ?? item.price) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-800 px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-bold text-base text-gold-400">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-400">Shipping & taxes calculated at checkout.</p>
              <button
                onClick={() => go('/checkout')}
                className="w-full bg-gold-500 text-black py-3.5 rounded-xl font-semibold text-sm hover:bg-gold-400 transition-colors"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => go('/cart')}
                className="w-full border border-ink-700 py-3 rounded-xl font-medium text-sm hover:border-gold-500 text-white transition-colors"
              >
                View Full Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
