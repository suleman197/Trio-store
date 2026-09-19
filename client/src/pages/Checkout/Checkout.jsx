import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, ChevronLeft, ChevronRight, Banknote, Building2, ShoppingBag, Tag, CircleCheckBig, Upload, Copy } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useSiteSettings from '../../hooks/useSiteSettings.jsx';
import { orderApi, couponApi } from '../../services';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatCurrency } from '../../utils/format';
import ScreenshotUpload from '../../components/checkout/ScreenshotUpload';

const STEPS = ['Customer Info', 'Shipping Address', 'Order Summary', 'Payment', 'Confirmation'];
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 0;
const BANK_DISCOUNT_PERCENT = 20;

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore();
  const { settings } = useSiteSettings();

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const initialCoupon = location.state?.coupon || null;
  const [code, setCode] = useState(initialCoupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState(initialCoupon);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [info, setInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [address, setAddress] = useState({ address: '', city: '', state: '', postalCode: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const subtotal = cart.subtotal || 0;
  const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discount ?? 0, subtotal) : 0;
  const afterCoupon = subtotal - couponDiscount;
  const bankDiscountAmount = Number(settings.bankDiscountPercent) || 200;
  const bankDiscount = paymentMethod === 'bank' ? Math.min(afterCoupon, bankDiscountAmount) : 0;
  const shippingFee = 0;
  const taxableAmount = afterCoupon - bankDiscount;
  const tax = Math.round(taxableAmount * 5) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  const setField = (setter) => (e) => setter((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!info.firstName.trim() || !info.lastName.trim()) return 'First and last name are required';
      if (!/^\S+@\S+\.\S+$/.test(info.email)) return 'A valid email is required';
      if (!info.phone.trim()) return 'Phone is required';
    }
    if (step === 1) {
      for (const k of Object.keys(address)) if (k !== 'postalCode' && !address[k].trim()) return 'Please complete every required address field';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, paymentMethod === 'bank' ? 4 : 3));
    window.scrollTo({ top: 0 });
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setCheckingCoupon(true);
    try {
      const result = await couponApi.validate(code.trim(), subtotal);
      setAppliedCoupon(result);
      toast.success(`Coupon applied — you save ${formatCurrency(result.discount)}`);
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(err.message);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const placeOrder = async () => {
    if (cart.items.length === 0) return;
    setPlacing(true);
    try {
      const order = await orderApi.place({
        items: cart.items.map((i) => ({
          product: i.productId ?? i.product?._id,
          quantity: i.quantity,
          variant: i.variant || {},
        })),
        customerInfo: info,
        shippingAddress: {
          ...address,
          postalCode: address.postalCode?.trim() || 'N/A',
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        bankDetails: paymentMethod === 'bank' ? {
          bankName: settings.bankName || 'HBL',
          accountTitle: settings.bankAccountTitle || 'MUHAMMAD ADA',
          accountNumber: settings.bankAccountNumber || '09917902364499',
        } : undefined,
      });
      setPlacedOrder(order);
      await cart.clear();
      setStep(4);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const handleScreenshotUpload = async (file) => {
    if (!placedOrder) return;
    setUploadingScreenshot(true);
    try {
      const updated = await orderApi.uploadScreenshot(placedOrder._id, file);
      setPlacedOrder(updated);
      toast.success('Screenshot uploaded! Awaiting payment verification.');
      setStep(5);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  // Step 4: Screenshot upload (bank only)
  if (step === 4 && placedOrder && placedOrder.paymentMethod === 'bank' && !placedOrder.bankDetails?.screenshotUrl)
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center mx-auto">
            <Upload size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">Upload Payment Screenshot</h1>
          <p className="mt-2 text-ink-400 text-sm">
            Please upload a screenshot of your bank transfer payment for order <span className="font-bold text-white">{placedOrder.orderNumber}</span>
          </p>
        </div>

        <div className="bg-[#111] border border-ink-800 rounded-2xl p-7">
          <ScreenshotUpload onUpload={handleScreenshotUpload} uploading={uploadingScreenshot} />
          <button
            onClick={() => { setStep(5); window.scrollTo({ top: 0 }); }}
            className="w-full mt-4 text-center text-sm text-ink-500 hover:text-ink-300 transition-colors py-2"
          >
            I'll upload later — View order confirmation
          </button>
        </div>
      </div>
    );

  // Step 4/5: Order Confirmation
  if ((step === 4 || step === 5) && placedOrder)
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gold-500 text-black flex items-center justify-center mx-auto">
          <CircleCheckBig size={36} strokeWidth={1.75} />
        </div>
        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-white">
          {step === 5 && placedOrder.paymentMethod === 'bank' ? 'Screenshot Uploaded!' : 'Order Confirmed!'}
        </h1>
        <p className="mt-3 text-ink-400 text-sm leading-relaxed max-w-md mx-auto">
          Thank you, {placedOrder.customerInfo.firstName}!{' '}
          {placedOrder.paymentMethod === 'bank' && placedOrder.paymentStatus === 'pending_verification'
            ? 'Your payment screenshot has been received. Our team will verify it shortly.'
            : 'Your order has been placed and will be processed shortly.'}
        </p>

        <dl className="mt-8 border border-ink-800 rounded-2xl divide-y divide-ink-800 text-sm text-left overflow-hidden bg-[#111]">
          <div className="flex justify-between px-6 py-4">
            <dt className="text-ink-400">Order Number</dt>
            <dd className="font-bold tracking-wide text-white">{placedOrder.orderNumber}</dd>
          </div>
          <div className="flex justify-between px-6 py-4">
            <dt className="text-ink-400">Items</dt>
            <dd className="font-semibold text-white">{placedOrder.items.length}</dd>
          </div>
          <div className="flex justify-between px-6 py-4">
            <dt className="text-ink-400">Total</dt>
            <dd className="font-bold text-white">{formatCurrency(placedOrder.total)}</dd>
          </div>
          <div className="flex justify-between px-6 py-4">
            <dt className="text-ink-400">Payment Method</dt>
            <dd className="font-semibold uppercase text-white">
              {placedOrder.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash on Delivery'}
            </dd>
          </div>
          {placedOrder.bankDiscount > 0 && (
            <div className="flex justify-between px-6 py-4">
              <dt className="text-emerald-500">Bank Discount</dt>
              <dd className="font-bold text-emerald-500">-{formatCurrency(placedOrder.bankDiscount)}</dd>
            </div>
          )}
          {placedOrder.paymentMethod === 'bank' && (
            <div className="px-6 py-4">
              <dt className="text-ink-400 mb-1">Payment Status</dt>
              <dd className="font-semibold text-amber-400">
                {placedOrder.paymentStatus === 'pending_verification' ? 'Awaiting Verification' : placedOrder.paymentStatus}
              </dd>
            </div>
          )}
          <div className="px-6 py-4">
            <dt className="text-ink-400 mb-1">Shipping to</dt>
            <dd className="font-medium leading-relaxed text-white">
              {placedOrder.shippingAddress.address}, {placedOrder.shippingAddress.city},{' '}
              {placedOrder.shippingAddress.state} {placedOrder.shippingAddress.postalCode && placedOrder.shippingAddress.postalCode !== 'N/A' ? placedOrder.shippingAddress.postalCode : ''},{' '}
              {placedOrder.shippingAddress.country}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => navigate(`/orders/${placedOrder._id}`)}>
            View Order Details
          </Button>
          <Button size="lg" variant="secondary" icon={ShoppingBag} onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );

  return (
    <div className="bg-[#0a0a0a] min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        {/* Stepper */}
        <ol className="flex items-center gap-0 mb-10 select-none">
          {STEPS.slice(0, paymentMethod === 'bank' ? 5 : 4).map((label, i) => (
            <li key={label} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-2.5 ${i <= step ? 'cursor-default' : 'opacity-40'}`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step
                      ? 'bg-gold-500 text-black border-gold-500'
                      : i === step
                        ? 'border-gold-500 bg-[#111] text-gold-500'
                        : 'border-ink-700 text-ink-500 bg-[#111]'
                  }`}
                >
                  {i < step ? <Check size={15} /> : i + 1}
                </span>
                <span className={`hidden sm:block text-xs font-semibold ${i === step ? 'text-white' : 'text-ink-500'}`}>{label}</span>
              </button>
              {i < (paymentMethod === 'bank' ? 4 : 3) && <div className={`flex-1 h-0.5 mx-3 rounded ${i < step ? 'bg-gold-500' : 'bg-ink-800'}`} />}
            </li>
          ))}
        </ol>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Step panels */}
          <div className="bg-[#111] border border-ink-800 rounded-2xl p-7">
            {step === 0 && (
              <>
                <h2 className="text-lg font-bold tracking-tight mb-6 text-white">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input id="co-first" name="firstName" label="First Name" required value={info.firstName} onChange={setField(setInfo)} />
                  <Input id="co-last" name="lastName" label="Last Name" required value={info.lastName} onChange={setField(setInfo)} />
                  <Input id="co-email" name="email" type="email" label="Email" required value={info.email} onChange={setField(setInfo)} />
                  <Input id="co-phone" name="phone" type="tel" label="Phone" required value={info.phone} onChange={setField(setInfo)} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-bold tracking-tight mb-6 text-white">Shipping Address</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input id="co-street" name="address" label="Street Address" required placeholder="123 Circuit Ave, Apt 4" value={address.address} onChange={setField(setAddress)} />
                  </div>
                  <Input id="co-city" name="city" label="City" required value={address.city} onChange={setField(setAddress)} />
                  <Input id="co-state" name="state" label="State / Province" required value={address.state} onChange={setField(setAddress)} />
                  <Input id="co-country" name="country" label="Country" required value={address.country} onChange={setField(setAddress)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-bold tracking-tight mb-6 text-white">Review Your Order</h2>
                <ul className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden">
                  {cart.items.map((item) => (
                    <li key={item._id} className="flex items-center gap-4 p-4">
                      <img src={item.product?.images?.[0] || item.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-ink-900 border border-ink-800 shrink-0" onError={(e) => (e.currentTarget.style.opacity = '0.25')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-white">{item.product?.name || item.name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          Qty {item.quantity}
                          {item.variant && Object.keys(item.variant).length > 0 && ` · ${Object.values(item.variant).join(', ')}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-white">{formatCurrency((item.unitPrice ?? item.price) * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {!appliedCoupon && (
                  <div className="mt-5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
                      <Tag size={13} /> Have a coupon?
                    </label>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME10"
                        className="flex-1 min-w-0 border border-ink-700 bg-ink-900 text-white rounded-lg px-3.5 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors placeholder:text-ink-600"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={checkingCoupon}
                        className="px-4 rounded-lg border border-gold-500 text-gold-500 font-semibold text-sm hover:bg-gold-500 hover:text-black transition-colors disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-bold tracking-tight mb-6 text-white">Payment Method</h2>
                <div className="space-y-4">
                  {/* COD */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-start gap-4 border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-gold-500 bg-ink-900/50' : 'border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} readOnly className="sr-only" />
                    <span className={`w-5 h-5 rounded-full border-[5px] mt-0.5 shrink-0 ${paymentMethod === 'cod' ? 'border-gold-500' : 'border-ink-600'}`} />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-semibold text-white">
                        <Banknote size={18} /> Cash on Delivery
                      </span>
                      <span className="block text-sm text-ink-400 mt-1 leading-relaxed">
                        Pay in cash when your order arrives at your door.
                      </span>
                    </span>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex items-start gap-4 border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      paymentMethod === 'bank' ? 'border-gold-500 bg-ink-900/50' : 'border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'bank'} readOnly className="sr-only" />
                    <span className={`w-5 h-5 rounded-full border-[5px] mt-0.5 shrink-0 ${paymentMethod === 'bank' ? 'border-gold-500' : 'border-ink-600'}`} />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-semibold text-white">
                        <Building2 size={18} /> Bank Transfer
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {formatCurrency(bankDiscountAmount)} OFF
                        </span>
                      </span>
                      <span className="block text-sm text-ink-400 mt-1 leading-relaxed">
                        Get {formatCurrency(bankDiscountAmount)} discount! Transfer to our bank account and upload payment screenshot.
                      </span>
                    </span>
                  </label>

                  {/* Bank Details */}
                  {paymentMethod === 'bank' && (
                    <div className="border border-emerald-500/30 rounded-xl p-5 bg-emerald-500/5">
                      <h4 className="text-sm font-bold text-emerald-500 mb-3">Transfer to this account:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-400">Bank Name</span>
                          <span className="text-sm font-semibold text-white">{settings.bankName || 'HBL'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-400">Account Title</span>
                          <span className="text-sm font-semibold text-white">{settings.bankAccountTitle || 'MUHAMMAD ADA'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-400">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white font-mono">{settings.bankAccountNumber || '09917902364499'}</span>
                            <button onClick={() => copyToClipboard(settings.bankAccountNumber || '09917902364499')} className="p-1 hover:text-gold-400 text-ink-500 transition-colors">
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-ink-500 leading-relaxed">
                        After transferring, you will upload a payment screenshot on the next step. Your order will be confirmed after verification.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Nav buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-ink-800">
              {step > 0 ? (
                <Button variant="ghost" onClick={back} icon={ChevronLeft}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate('/cart')} icon={ChevronLeft}>
                  Cart
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={next}>
                  Continue <ChevronRight size={16} />
                </Button>
              ) : paymentMethod === 'bank' ? (
                <Button onClick={placeOrder} loading={placing} disabled={cart.items.length === 0} icon={Upload}>
                  Continue to Upload · {formatCurrency(total)}
                </Button>
              ) : (
                <Button onClick={placeOrder} loading={placing} disabled={cart.items.length === 0} icon={Check}>
                  Place Order · {formatCurrency(total)}
                </Button>
              )}
            </div>
          </div>

          {/* Summary rail */}
          <aside className="bg-[#111] border border-ink-800 rounded-2xl p-6 lg:sticky lg:top-28">
            <h3 className="font-bold tracking-tight mb-4 text-white">Summary</h3>
            <dl className="space-y-2.5 text-sm">
              <SumRow label={`Items (${cart.items.reduce((s, i) => s + (i.quantity || 1), 0)})`} value={formatCurrency(subtotal)} />
              {couponDiscount > 0 && <SumRow label={`Coupon (${appliedCoupon.code})`} value={`-${formatCurrency(couponDiscount)}`} accent />}
              {bankDiscount > 0 && <SumRow label="Bank Discount" value={`-${formatCurrency(bankDiscount)}`} accent />}
              <SumRow label="Tax (5%)" value={formatCurrency(tax)} />
              <div className="border-t border-ink-800 pt-3 flex justify-between items-baseline">
                <dt className="font-bold text-white">Total</dt>
                <dd className="font-extrabold text-xl tracking-tight text-white">{formatCurrency(total)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-[11px] text-ink-500 leading-relaxed">
              By placing this order you agree to the TRIO Terms & Conditions and Privacy Policy.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SumRow({ label, value, accent }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-400">{label}</dt>
      <dd className={`font-semibold ${accent ? 'text-emerald-500' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
