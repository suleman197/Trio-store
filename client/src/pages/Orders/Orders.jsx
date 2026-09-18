import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen, ChevronRight } from 'lucide-react';
import { orderApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { StatusBadge, OrderStatusBadge } from '../../components/common/Badges';
import { Skeleton } from '../../components/common/Skeletons';
import { formatCurrency, formatDate, ORDER_STATUS_META } from '../../utils/format';

const STATUS_TABS = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(() => orderApi.mine({ page, limit: 8, ...(status ? { status } : {}) }), [status, page]);

  const orders = data?.orders || [];

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Orders' }]} />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-white">My Orders</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-5">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              status === s ? 'bg-gold-500 text-black border-gold-500' : 'border-ink-700 text-ink-400 hover:border-gold-500/50'
            }`}
          >
            {s ? ORDER_STATUS_META[s].label : 'All Orders'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No orders yet"
          description={status ? `You have no ${ORDER_STATUS_META[status]?.label.toLowerCase()} orders.` : "When you place your first order it will show up here."}
          action={
            <Link to="/shop" className="bg-gold-500 text-black px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block border border-ink-800 rounded-2xl p-5 bg-[#111] hover:border-gold-500/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] transition-all group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ink-800">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                    <div>
                      <p className="text-ink-500 uppercase tracking-wide font-semibold">Order</p>
                      <p className="font-bold text-sm mt-0.5 text-white">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-ink-500 uppercase tracking-wide font-semibold">Placed</p>
                      <p className="font-medium text-sm mt-0.5 text-white">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-ink-500 uppercase tracking-wide font-semibold">Total</p>
                      <p className="font-bold text-sm mt-0.5 text-white">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.paymentStatus} />
                    <OrderStatusBadge status={order.status} />
                    <ChevronRight size={16} className="text-ink-500 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-ink-800 bg-ink-900 shrink-0"
                      onError={(e) => (e.currentTarget.style.opacity = '0.25')}
                    />
                  ))}
                  {order.items.length > 4 && (
                    <span className="w-14 h-14 rounded-lg border border-dashed border-ink-700 flex items-center justify-center text-xs font-bold text-ink-500 shrink-0">
                      +{order.items.length - 4}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-ink-500 shrink-0">
                    {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
