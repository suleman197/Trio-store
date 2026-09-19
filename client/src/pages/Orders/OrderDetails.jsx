import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, PackageSearch, XCircle, Upload, CheckCircle } from 'lucide-react';
import { orderApi } from '../../services';
import useFetch from '../../hooks/useFetch';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/Modal';
import { StatusBadge, OrderStatusBadge } from '../../components/common/Badges';
import { Skeleton } from '../../components/common/Skeletons';
import { formatCurrency, formatDateTime, ORDER_STATUS_META } from '../../utils/format';
import ScreenshotUpload from '../../components/checkout/ScreenshotUpload';

const TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, loading, refetch } = useFetch(() => orderApi.get(id), [id]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (loading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );

  if (!order)
    return (
      <EmptyState
        icon={PackageSearch}
        title="Order not found"
        description="This order doesn't exist or belongs to another account."
        action={<Button onClick={() => navigate('/orders')}>Back to Orders</Button>}
      />
    );

  const currentStep = ORDER_STATUS_META[order.status]?.step ?? 0;
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await orderApi.cancel(order._id);
      toast.success('Order cancelled');
      setCancelOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleScreenshotUpload = async (file) => {
    setUploading(true);
    try {
      await orderApi.uploadScreenshot(order._id, file);
      toast.success('Screenshot uploaded! Awaiting verification.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Orders', to: '/orders' }, { label: order.orderNumber }]} />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 -ml-2 rounded-lg hover:bg-ink-800 transition-colors text-white" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{order.orderNumber}</h1>
            <p className="text-xs text-ink-500 mt-0.5">Placed {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <Button size="sm" variant="danger" icon={XCircle} onClick={() => setCancelOpen(true)}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="border border-ink-800 rounded-2xl p-6 mb-6 bg-[#111]">
          <ol className="flex items-start">
            {TIMELINE.map((s, i) => {
              const done = i <= currentStep;
              return (
                <li key={s} className={`flex-1 last:flex-none ${i === TIMELINE.length - 1 ? '' : ''}`}>
                  <div className="flex items-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0 transition-colors ${
                        done ? 'bg-gold-500 text-black border-gold-500' : 'bg-[#111] text-ink-500 border-ink-700'
                      }`}
                    >
                      {done ? <svg viewBox="0 0 10 8" className="w-3 h-3 fill-none stroke-current stroke-[2.5]"><path d="M1 4l3 3 5-6" /></svg> : i + 1}
                    </span>
                    {i < TIMELINE.length - 1 && (
                      <span className={`flex-1 h-0.5 mx-2 rounded ${i < currentStep ? 'bg-gold-500' : 'bg-ink-700'}`} style={{ minWidth: 12 }} />
                    )}
                  </div>
                  <p className={`mt-2 text-[11px] font-semibold capitalize ${done ? 'text-white' : 'text-ink-500'}`}>{ORDER_STATUS_META[s].label}</p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Items */}
        <div className="border border-ink-800 rounded-2xl divide-y divide-ink-800 overflow-hidden bg-[#111]">
          {order.items.map((item, i) => (
            <div key={i} className="p-5 flex gap-4">
              <img
                src={item.image}
                alt=""
                className="w-20 h-20 rounded-xl object-cover border border-ink-800 bg-ink-900 shrink-0"
                onError={(e) => (e.currentTarget.style.opacity = '0.25')}
              />
              <div className="flex-1 min-w-0 flex justify-between gap-3">
                <div className="min-w-0">
                  {item.slug ? (
                    <Link to={`/product/${item.slug}`} className="font-semibold hover:text-gold-400 line-clamp-2 block text-white">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-semibold line-clamp-2 text-white">{item.name}</p>
                  )}
                  <p className="text-xs text-ink-500 mt-1">SKU: {item.sku}</p>
                  {item.variant && Object.keys(item.variant).length > 0 && (
                    <p className="text-xs text-ink-500">{Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                  )}
                  <p className="text-xs text-ink-500 mt-1">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold whitespace-nowrap text-white">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Side rail */}
        <aside className="space-y-6">
          <div className="border border-ink-800 rounded-2xl p-5 bg-[#111]">
            <h3 className="font-bold text-sm tracking-tight mb-4 text-white">Payment Summary</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.discount > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`-${formatCurrency(order.discount)}`} accent />
              )}
              {order.bankDiscount > 0 && (
                <Row label="Bank Discount" value={`-${formatCurrency(order.bankDiscount)}`} accent />
              )}
              <Row label="Shipping" value={order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee)} />
              <Row label="Tax" value={formatCurrency(order.tax)} />
              <div className="border-t border-ink-800 pt-2.5 flex justify-between">
                <dt className="font-bold text-white">Total</dt>
                <dd className="font-extrabold text-white">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 pt-4 border-t border-ink-800 text-xs text-ink-500">
              Payment: <span className="font-semibold uppercase">{order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash on Delivery'}</span> ·{' '}
              <StatusBadge status={order.paymentStatus} className="!px-2 !py-0.5" />
            </p>
          </div>

          {/* Bank Payment Status */}
          {order.paymentMethod === 'bank' && (
            <div className="border border-ink-800 rounded-2xl p-5 bg-[#111]">
              <h3 className="font-bold text-sm tracking-tight mb-3 text-white">Bank Payment</h3>
              {order.bankDetails?.screenshotUrl ? (
                <div className="space-y-3">
                  <img
                    src={order.bankDetails.screenshotUrl}
                    alt="Payment screenshot"
                    className="w-full max-h-60 object-contain rounded-xl border border-ink-800 bg-ink-900"
                    onClick={() => window.open(order.bankDetails.screenshotUrl, '_blank')}
                  />
                  {order.paymentStatus === 'pending_verification' && (
                    <p className="text-amber-400 text-xs flex items-center gap-1.5">
                      <Upload size={13} /> Screenshot uploaded. Awaiting verification.
                    </p>
                  )}
                  {order.paymentStatus === 'verified' && (
                    <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                      <CheckCircle size={13} /> Payment verified!
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-ink-400 text-xs mb-3">No screenshot uploaded yet. Transfer to:</p>
                  <div className="space-y-1 text-xs mb-4">
                    <p className="text-ink-400">Bank: <span className="font-semibold text-white">{order.bankDetails?.bankName || 'HBL'}</span></p>
                    <p className="text-ink-400">Account: <span className="font-semibold text-white">{order.bankDetails?.accountTitle || 'MUHAMMAD ADA'}</span></p>
                    <p className="text-ink-400">Number: <span className="font-semibold text-white font-mono">{order.bankDetails?.accountNumber || '09917902364499'}</span></p>
                  </div>
                  {['pending_verification', 'failed'].includes(order.paymentStatus) && (
                    <ScreenshotUpload onUpload={handleScreenshotUpload} uploading={uploading} />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border border-ink-800 rounded-2xl p-5 bg-[#111]">
            <h3 className="font-bold text-sm tracking-tight mb-2 text-white">Shipping Address</h3>
            <address className="not-italic text-sm text-ink-400 leading-relaxed">
              {order.customerInfo.firstName} {order.customerInfo.lastName}
              <br />
              {order.shippingAddress.address}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode ? order.shippingAddress.postalCode : ''}
              <br />
              {order.shippingAddress.country}
              <br />
              <span className="text-ink-500">{order.customerInfo.phone}</span>
            </address>
          </div>
        </aside>
      </div>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="mt-6 border border-ink-800 rounded-2xl p-6 bg-[#111]">
          <h3 className="font-bold text-sm tracking-tight mb-4 text-white">Status History</h3>
          <ol className="space-y-3">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <OrderStatusBadge status={h.status} />
                <span className="text-ink-400">{h.note}</span>
                <time className="ml-auto text-xs text-ink-500">{formatDateTime(h.at)}</time>
              </li>
            ))}
          </ol>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        message={`Order ${order.orderNumber} will be cancelled and any reserved stock released.`}
        confirmLabel="Cancel Order"
      />
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className={`font-semibold ${accent ? 'text-emerald-500' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
