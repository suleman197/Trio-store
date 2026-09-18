import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Power, TicketPercent, Copy } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable } from '../../../components/admin/ui';
import Button from '../../../components/common/Button';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import { Input, Select } from '../../../components/common/Input';
import { Badge } from '../../../components/common/Badges';

export default function AdminCoupons() {
  const { data, loading, refetch } = useFetch(() => adminApi.coupons.list({ limit: 100 }), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggleActive = async (c) => {
    try {
      await adminApi.coupons.update(c._id, { isActive: !c.isActive });
      toast.success(`Coupon ${!c.isActive ? 'enabled' : 'disabled'}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.coupons.remove(deleteTarget._id);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1200px]">
      <AdminPageHeader
        title="Coupons"
        subtitle={`${data?.coupons?.length ?? '…'} discount codes`}
        action={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Create Coupon
          </Button>
        }
      />

      {loading ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : (
        <DataTable
          columns={[
            {
              key: 'code',
              label: 'Code',
              render: (c) => (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(c.code);
                    toast.success(`${c.code} copied`);
                  }}
                  className="inline-flex items-center gap-1.5 font-mono font-bold text-sm bg-gold-500 text-black px-2.5 py-1 rounded-md hover:bg-gold-600 transition-colors"
                  title="Click to copy"
                >
                  {c.code} <Copy size={11} />
                </button>
              ),
            },
            {
              key: 'discount',
              label: 'Discount',
              render: (c) => (
                <span className="font-semibold">{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${Number(c.discountValue).toFixed(2)}`}</span>
              ),
            },
            { key: 'minOrderAmount', label: 'Min Order', align: 'right', render: (c) => (c.minOrderAmount ? `$${c.minOrderAmount}` : '—'), mobileStrong: false },
            {
              key: 'usedCount',
              label: 'Usage',
              align: 'center',
              render: (c) => `${c.usedCount}${c.usageLimit != null ? ` / ${c.usageLimit}` : ''}`,
              mobileStrong: false,
            },
            {
              key: 'expiresAt',
              label: 'Expires',
              align: 'center',
              render: (c) =>
                c.expiresAt ? (
                  <span className={new Date(c.expiresAt) < new Date() ? 'text-red-500 font-semibold' : ''}>
                    {new Date(c.expiresAt).toLocaleDateString()}
                  </span>
                ) : (
                  'Never'
                ),
              mobileStrong: false,
            },
            {
              key: 'isActive',
              label: 'Status',
              align: 'center',
              render: (c) => (
                <Badge tone={c.isActive ? 'dark' : 'outline'} className={c.isActive ? '' : '!text-ink-500'}>
                  {c.isActive ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (c) => (
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => toggleActive(c)} title={c.isActive ? 'Disable' : 'Enable'} className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors">
                    <Power size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(c);
                      setFormOpen(true);
                    }}
                    title="Edit"
                    className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} title="Delete" className="p-2 rounded-lg hover:bg-red-500/10 text-ink-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={data?.coupons || []}
          empty="No coupons yet"
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit — ${editing.code}` : 'Create Coupon'} size="sm">
        <CouponForm coupon={editing} onDone={() => { setFormOpen(false); refetch(); }} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete coupon?"
        message={`${deleteTarget?.code} will no longer be redeemable. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function CouponForm({ coupon, onDone }) {
  const isEdit = !!coupon;
  const [form, setForm] = useState(() =>
    isEdit
      ? { ...coupon }
      : {
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: '',
          maxDiscountAmount: '',
          minOrderAmount: '',
          usageLimit: '',
          expiresAt: '',
          isActive: true,
        }
  );
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.code.trim() && !isEdit) return toast.error('Coupon code is required');
    if (!form.discountValue || Number(form.discountValue) <= 0) return toast.error('Discount value must be greater than zero');
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) return toast.error('Percentage cannot exceed 100');

    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
      minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: !!form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await adminApi.coupons.update(coupon._id, payload);
      else await adminApi.coupons.create(payload);
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isEdit && <Input label="Code *" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" maxLength={30} />}
      <Input label="Description" value={form.description} onChange={set('description')} placeholder="10% off first order" />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Discount Type *" value={form.discountType} onChange={set('discountType')}>
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed ($)</option>
        </Select>
        <Input label={form.discountType === 'percentage' ? 'Percent Off *' : 'Amount Off ($) *'} type="number" min="0" step="0.01" value={form.discountValue} onChange={set('discountValue')} />
        <Input label="Min. Order ($)" type="number" min="0" value={form.minOrderAmount ?? ''} onChange={set('minOrderAmount')} placeholder="0" />
        <Input label="Max Discount ($)" type="number" min="0" value={form.maxDiscountAmount ?? ''} onChange={set('maxDiscountAmount')} placeholder="No cap" />
        <Input label="Usage Limit" type="number" min="0" value={form.usageLimit ?? ''} onChange={set('usageLimit')} placeholder="Unlimited" />
        <Input label="Expiration Date" type="date" value={form.expiresAt ? String(form.expiresAt).slice(0, 10) : ''} onChange={set('expiresAt')} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
        <input type="checkbox" checked={!!form.isActive} onChange={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className="w-4 h-4 accent-[#D4AF37]" />
        <span className="text-sm font-medium inline-flex items-center gap-1.5">
          <TicketPercent size={14} /> Coupon is active
        </span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button loading={saving} onClick={submit}>{isEdit ? 'Save Changes' : 'Create Coupon'}</Button>
      </div>
    </div>
  );
}
