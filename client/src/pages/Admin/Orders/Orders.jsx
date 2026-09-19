import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, XCircle, CheckCircle, X, Upload } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable, SearchBox } from '../../../components/admin/ui';
import { OrderStatusBadge } from '../../../components/common/Badges';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Pagination from '../../../components/common/Pagination';
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_META } from '../../../utils/format';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'pending_verification', 'verified'];

export default function AdminOrders({ detail = false }) {
  const [params] = useSearchParams();
  const orderId = detail ? params.get('id') : null;
  return orderId ? <OrderDetailView id={orderId} /> : <OrdersList />;
}

function OrdersList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, refetch } = useFetch(
    () => adminApi.orders.list({ search: search || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, limit: 15 }),
    [search, status, paymentStatus, page]
  );

  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const updateStatus = async (order, newStatus) => {
    try {
      await adminApi.orders.updateStatus(order._id, newStatus);
      toast.success(`Order marked as ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updatePayment = async (order, val) => {
    try {
      await adminApi.orders.updatePayment(order._id, val);
      toast.success(`Payment marked as ${val}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await adminApi.orders.updateStatus(cancelTarget._id, 'cancelled');
      toast.success('Order cancelled — stock restored');
      setCancelTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const selectCls =
    'border border-ink-700 bg-[#111] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none cursor-pointer';

  return (
    <div className="max-w-[1400px]">
      <AdminPageHeader title="Orders" subtitle={`${data?.meta?.total ?? '…'} orders`} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Order #, customer email…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-72 rounded-xl" />
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'orderNumber', label: 'Order #', render: (o) => <span className="font-semibold">{o.orderNumber}</span> },
              {
                key: 'customer',
                label: 'Customer',
                render: (o) => (
                  <div>
                    <p className="font-medium">{o.customerInfo?.firstName} {o.customerInfo?.lastName}</p>
                    <p className="text-xs text-ink-500">{o.customerInfo?.email}</p>
                  </div>
                ),
              },
              { key: 'items', label: 'Items', align: 'center', render: (o) => o.items.reduce((n, i) => n + i.quantity, 0), mobileStrong: false },
              { key: 'total', label: 'Amount', align: 'right', render: (o) => formatCurrency(o.total) },
              { key: 'paymentMethod', label: 'Method', align: 'center', render: (o) => <span className="text-[11px] font-bold uppercase">{o.paymentMethod === 'bank' ? 'Bank' : 'COD'}</span>, mobileStrong: false },
              {
                key: 'paymentStatus',
                label: 'Payment',
                align: 'center',
                render: (o) => (
                  <select
                    value={o.paymentStatus}
                    onChange={(e) => updatePayment(o, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-[11px] font-bold uppercase rounded-md border px-1.5 py-1 cursor-pointer focus:outline-none ${
                      o.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : o.paymentStatus === 'failed' || o.paymentStatus === 'refunded'
                          ? 'bg-red-500/10 border-red-500/30 text-red-500'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    }`}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ),
              },
              { key: 'status', label: 'Status', align: 'center', render: (o) => <OrderStatusBadge status={o.status} /> },
              { key: 'createdAt', label: 'Date', align: 'right', render: (o) => formatDate(o.createdAt), mobileStrong: false },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (o) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => setViewTarget(o)} title="View details" className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors">
                      <Eye size={15} />
                    </button>
                    {!['cancelled', 'delivered'].includes(o.status) && (
                      <button onClick={() => setCancelTarget(o)} title="Cancel order" className="p-2 rounded-lg hover:bg-red-500/10 text-ink-400 hover:text-red-500 transition-colors">
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={data?.orders || []}
            empty="No orders found"
            renderCard={(o) => (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="text-sm">{o.customerInfo?.firstName} {o.customerInfo?.lastName}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">{formatDate(o.createdAt)}</span>
                  <span className="font-bold">{formatCurrency(o.total)}</span>
                </div>
                <button onClick={() => setViewTarget(o)} className="w-full border border-ink-700 rounded-lg py-2 text-xs font-semibold hover:border-gold-500 hover:text-gold-500 transition-colors">
                  View Details
                </button>
              </div>
            )}
          />
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {/* Detail modal with status control */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={`Order ${viewTarget?.orderNumber || ''}`} size="lg">
        {viewTarget && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500 mb-1">Customer</p>
                <p className="font-medium text-white">{viewTarget.customerInfo?.firstName} {viewTarget.customerInfo?.lastName}</p>
                <p className="text-ink-400 text-xs mt-0.5">{viewTarget.customerInfo?.email}</p>
                <p className="text-ink-400 text-xs">{viewTarget.customerInfo?.phone}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500 mb-1">Ship To</p>
                <p className="text-ink-400 leading-relaxed">
                  {viewTarget.shippingAddress?.address},<br />
                  {viewTarget.shippingAddress?.city}, {viewTarget.shippingAddress?.state} {viewTarget.shippingAddress?.postalCode || ''}<br />
                  {viewTarget.shippingAddress?.country}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500 mb-1">Meta</p>
                <p className="text-ink-400">Placed {formatDateTime(viewTarget.createdAt)}</p>
                <p className="text-ink-400 uppercase font-semibold text-xs mt-0.5">
                  {viewTarget.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash on Delivery'}
                </p>
                {viewTarget.bankDiscount > 0 && (
                  <p className="text-emerald-500 text-xs mt-0.5">Bank Discount: {formatCurrency(viewTarget.bankDiscount)}</p>
                )}
              </div>
            </div>

            {/* Bank Payment Screenshot */}
            {viewTarget.paymentMethod === 'bank' && viewTarget.bankDetails?.screenshotUrl && (
              <div className="bg-ink-900/30 rounded-xl p-4 border border-ink-800">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500 mb-3">Payment Screenshot</p>
                <div className="flex gap-4">
                  <img
                    src={viewTarget.bankDetails.screenshotUrl}
                    alt="Bank payment screenshot"
                    className="w-48 h-48 rounded-xl object-cover border border-ink-700 bg-ink-900"
                    onClick={() => window.open(viewTarget.bankDetails.screenshotUrl, '_blank')}
                  />
                  <div className="flex-1 space-y-2 text-sm">
                    <p className="text-ink-400"><span className="text-ink-500">Bank:</span> {viewTarget.bankDetails.bankName}</p>
                    <p className="text-ink-400"><span className="text-ink-500">Account:</span> {viewTarget.bankDetails.accountTitle}</p>
                    <p className="text-ink-400"><span className="text-ink-500">Number:</span> {viewTarget.bankDetails.accountNumber}</p>
                    <p className="text-ink-400"><span className="text-ink-500">Uploaded:</span> {viewTarget.bankDetails.uploadedAt ? formatDateTime(viewTarget.bankDetails.uploadedAt) : '—'}</p>
                    {viewTarget.paymentStatus === 'pending_verification' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              await adminApi.orders.verifyBank(viewTarget._id);
                              toast.success('Bank payment verified');
                              setViewTarget((v) => ({ ...v, paymentStatus: 'verified' }));
                              refetch();
                            } catch (err) { toast.error(err.message); }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                        >
                          <CheckCircle size={14} /> Verify Payment
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Rejection reason (optional):');
                            try {
                              await adminApi.orders.rejectBank(viewTarget._id, reason || 'Payment not verified');
                              toast.success('Bank payment rejected');
                              setViewTarget((v) => ({ ...v, paymentStatus: 'failed' }));
                              refetch();
                            } catch (err) { toast.error(err.message); }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {viewTarget.bankDetails.rejectionReason && (
                      <p className="text-red-400 text-xs">Rejection reason: {viewTarget.bankDetails.rejectionReason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status controls */}
            <div className="grid sm:grid-cols-2 gap-4 bg-ink-900/30 rounded-xl p-4 border border-ink-800">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-500 block mb-1.5">Fulfillment Status</span>
                <select
                  value={viewTarget.status}
                  disabled={['cancelled'].includes(viewTarget.status)}
                  onChange={(e) => {
                    updateStatus(viewTarget, e.target.value).then(() => setViewTarget((v) => ({ ...v, status: e.target.value })));
                  }}
                  className="w-full border border-ink-700 bg-[#111] text-white rounded-lg px-3 py-2.5 text-sm font-semibold capitalize focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none disabled:opacity-50"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-500 block mb-1.5">Payment Status</span>
                <select
                  value={viewTarget.paymentStatus}
                  onChange={(e) => {
                    updatePayment(viewTarget, e.target.value).then(() => setViewTarget((v) => ({ ...v, paymentStatus: e.target.value })));
                  }}
                  className="w-full border border-ink-700 bg-[#111] text-white rounded-lg px-3 py-2.5 text-sm font-semibold capitalize focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden">
              {viewTarget.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 p-3.5 text-sm">
                  <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-900 border border-ink-800" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-ink-500">SKU {item.sku} · Qty {item.quantity}</p>
                  </div>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="text-sm space-y-1.5 max-w-xs ml-auto">
              <Row label="Subtotal" value={formatCurrency(viewTarget.subtotal)} />
              {viewTarget.discount > 0 && <Row label={`Discount${viewTarget.couponCode ? ` (${viewTarget.couponCode})` : ''}`} value={`-${formatCurrency(viewTarget.discount)}`} />}
              {viewTarget.bankDiscount > 0 && <Row label="Bank Discount" value={`-${formatCurrency(viewTarget.bankDiscount)}`} />}
              <Row label="Shipping" value={viewTarget.shippingFee === 0 ? 'Free' : formatCurrency(viewTarget.shippingFee)} />
              <Row label="Tax" value={formatCurrency(viewTarget.tax)} />
              <div className="flex justify-between border-t border-ink-800 pt-1.5">
                <dt className="font-bold text-white">Total</dt>
                <dd className="font-extrabold text-white">{formatCurrency(viewTarget.total)}</dd>
              </div>
            </dl>

            {/* History */}
            {viewTarget.statusHistory?.length > 0 && (
              <ol className="space-y-1.5 border-t border-ink-800 pt-4">
                {[...viewTarget.statusHistory].reverse().map((h, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <OrderStatusBadge status={h.status} />
                    <span className="text-ink-400">{h.note}</span>
                    <time className="ml-auto text-ink-500 shrink-0">{formatDateTime(h.at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel this order?"
        message={`Order ${cancelTarget?.orderNumber} will be cancelled and stock will be restored to inventory.`}
        confirmLabel="Cancel Order"
      />
    </div>
  );
}

function OrderDetailView({ id }) {
  const { data: order, loading } = useFetch(() => adminApi.orders.get(id), [id]);
  if (loading || !order)
    return (
      <div className="max-w-3xl mx-auto">
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  return (
    <div className="max-w-3xl mx-auto bg-[#111] border border-ink-800 rounded-xl p-6 space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white">{order.orderNumber}</h1>
      <ItemsSummary order={order} />
    </div>
  );
}

function ItemsSummary({ order }) {
  return (
    <>
      <ul className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 p-3.5 text-sm">
            <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-900" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.name}</p>
              <p className="text-xs text-ink-500">Qty {item.quantity}</p>
            </div>
            <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="text-right text-sm font-extrabold text-white">Total: {formatCurrency(order.total)}</p>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}
