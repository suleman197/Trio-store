import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Package, Users, AlertTriangle, XCircle, Clock, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { StatCard, AdminPageHeader, DataTable } from '../../../components/admin/ui';
import { OrderStatusBadge } from '../../../components/common/Badges';
import { RowSkeleton } from '../../../components/common/Skeletons';
import { formatCurrency, formatDate } from '../../../utils/format';

export default function AdminDashboard() {
  const { data, loading } = useFetch(() => adminApi.dashboard(), []);
  const stats = data?.stats;
  const salesByDay = (data?.salesByDay || []).map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  if (loading)
    return (
      <div>
        <AdminPageHeader title="Dashboard" subtitle="Loading store overview…" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <RowSkeleton rows={5} cols={6} />
      </div>
    );

  const topProducts = data.topProducts || [];

  return (
    <div className="max-w-[1400px]">
      <AdminPageHeader
        title="Dashboard"
        subtitle={`Store overview — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Sales" value={formatCurrency(stats.totalSales)} sub={`${stats.paidOrders} paid orders`} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders} tone="light" />
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts} />
        <StatCard icon={Users} label="Total Customers" value={stats.totalCustomers} tone="light" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStockCount} tone="light" sub="Below threshold" />
        <StatCard icon={XCircle} label="Out of Stock" value={stats.outOfStockCount} />
        <StatCard icon={TrendingUp} label="Avg. Order Value" value={formatCurrency(stats.totalOrders ? stats.totalSales / Math.max(stats.paidOrders, 1) : 0)} tone="light" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5 mt-8">
        <section className="lg:col-span-2 bg-[#111] border border-ink-800 rounded-xl p-6">
          <h3 className="font-bold tracking-tight mb-1 text-white">Sales Overview</h3>
          <p className="text-xs text-ink-400 mb-5">Revenue & orders · last 14 days</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={salesByDay} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} tickLine={false} axisLine={{ stroke: '#262626' }} />
              <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                formatter={(value, name) => (name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders'])}
                contentStyle={{ borderRadius: 10, border: '1px solid #262626', background: '#111', color: '#fff', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" />
              <Bar dataKey="orders" fill="#525252" radius={[3, 3, 0, 0]} barSize={14} />
            </ComposedChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-[#111] border border-ink-800 rounded-xl p-6">
          <h3 className="font-bold tracking-tight mb-1 text-white">Best Sellers</h3>
          <p className="text-xs text-ink-400 mb-5">Top products by units sold</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center">No sales data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 10.5, fill: '#a3a3a3' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                  />
                  <Tooltip formatter={(v) => [`${v} units`, 'Sold']} contentStyle={{ borderRadius: 10, fontSize: 12, background: '#111', border: '1px solid #262626', color: '#fff' }} cursor={{ fill: '#1a1a1a' }} />
                  <Bar dataKey="unitsSold" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={13} />
                </BarChart>
              </ResponsiveContainer>
              <ul className="mt-4 space-y-2 border-t border-ink-800 pt-3">
                {topProducts.map((p, i) => (
                  <li key={i} className="flex justify-between text-xs">
                    <span className="text-ink-400 truncate pr-2">{i + 1}. {p.name}</span>
                    <span className="font-bold shrink-0 text-white">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-8">
        <AdminPageHeader
          title="Recent Orders"
          action={
            <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-widest text-gold-500 hover:text-gold-400 transition-colors">
              View All →
            </Link>
          }
        />
        <DataTable
          columns={[
            { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-semibold">{o.orderNumber}</span> },
            {
              key: 'customer',
              label: 'Customer',
              render: (o) => `${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`,
            },
            { key: 'items', label: 'Items', align: 'center', render: (o) => o.items.length },
            { key: 'total', label: 'Total', align: 'right', render: (o) => formatCurrency(o.total) },
            { key: 'paymentStatus', label: 'Payment', align: 'center', render: (o) => <OrderStatusBadge status={o.paymentStatus} /> },
            { key: 'status', label: 'Status', align: 'center', render: (o) => <OrderStatusBadge status={o.status} /> },
            { key: 'createdAt', label: 'Date', align: 'right', render: (o) => formatDate(o.createdAt), mobileStrong: false },
          ]}
          rows={data.recentOrders}
          empty="No orders yet"
        />
      </section>
    </div>
  );
}
