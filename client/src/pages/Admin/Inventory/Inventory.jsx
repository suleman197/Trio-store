import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Minus, History, RotateCcw, X } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable, SearchBox } from '../../../components/admin/ui';
import { InventoryStatusBadge } from '../../../components/common/Badges';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { Input, Textarea, Select } from '../../../components/common/Input';
import Pagination from '../../../components/common/Pagination';
import { formatDateTime } from '../../../utils/format';

const STATUS_TABS = [
  ['', 'All'],
  ['in_stock', 'In Stock'],
  ['low_stock', 'Low Stock'],
  ['out_of_stock', 'Out of Stock'],
];

export default function AdminInventory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, refetch } = useFetch(
    () => adminApi.inventory.list({ search: search || undefined, status: status || undefined, page, limit: 15 }),
    [search, status, page]
  );

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyRows, setHistoryRows] = useState(null);

  const openHistory = async (p) => {
    setHistoryTarget(p);
    setHistoryRows(null);
    try {
      const rows = await adminApi.inventory.history(p._id);
      setHistoryRows(rows);
    } catch (err) {
      toast.error(err.message);
      setHistoryRows([]);
    }
  };

  return (
    <div className="max-w-[1300px]">
      <AdminPageHeader title="Inventory" subtitle="Track and adjust stock levels — every change is logged" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or SKU…" />
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => {
                setStatus(val);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                status === val ? 'bg-gold-500 text-black border-gold-500' : 'border-ink-700 text-ink-400 hover:border-gold-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-72 rounded-xl" />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Product',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-900 border border-ink-800 shrink-0" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate max-w-[220px]">{p.name}</p>
                      <p className="text-xs text-ink-500">{p.sku}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'sku', label: 'SKU', mobileStrong: false },
              {
                key: 'stock',
                label: 'Current Stock',
                align: 'center',
                render: (p) => <span className={`text-base font-extrabold ${p.stock <= 0 ? 'text-red-500' : p.stock <= p.lowStockThreshold ? 'text-amber-500' : 'text-white'}`}>{p.stock}</span>,
              },
              { key: 'lowStockThreshold', label: 'Low Limit', align: 'center', mobileStrong: false },
              { key: 'stockStatus', label: 'Status', align: 'center', render: (p) => <InventoryStatusBadge stockStatus={p.stockStatus} /> },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (p) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openHistory(p)} title="Stock history" className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors">
                      <History size={15} />
                    </button>
                    <button onClick={() => setAdjustTarget(p)} title="Adjust stock" className="p-2 rounded-lg bg-gold-500 text-black hover:bg-gold-600 transition-colors">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.inventory || []}
            empty="No products match this filter"
          />
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <AdjustModal product={adjustTarget} onClose={() => setAdjustTarget(null)} onDone={() => { setAdjustTarget(null); refetch(); }} />

      {/* History drawer */}
      <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Stock History — ${historyTarget?.name || ''}`} size="md">
        {!historyRows ? (
          <div className="skeleton h-48 rounded-xl" />
        ) : historyRows.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-8">No adjustments recorded for this product yet.</p>
        ) : (
          <ol className="relative border-l border-ink-800 ml-2 space-y-5">
            {historyRows.map((h) => (
              <li key={h._id} className="ml-6">
                <span className={`absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 border-[#111] ${h.quantityChanged >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`font-bold ${h.quantityChanged >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {h.quantityChanged >= 0 ? '+' : ''}
                    {h.quantityChanged}
                  </span>
                  <span className="text-ink-500 text-xs">({h.previousQuantity} → {h.newQuantity})</span>
                  {h.order && <span className="text-[11px] font-semibold bg-ink-900 border border-ink-800 px-1.5 py-0.5 rounded">{h.order.orderNumber}</span>}
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{h.reason}</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  {formatDateTime(h.at)}
                  {h.admin ? ` · by ${h.admin.firstName} ${h.admin.lastName}` : ' · system'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </div>
  );
}

function AdjustModal({ product, onClose, onDone }) {
  const [type, setType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const submit = async () => {
    if (!quantity && type !== 'set') return toast.error('Enter a quantity');
    if (!reason.trim()) return toast.error('A reason is required');
    setSaving(true);
    try {
      const res = await adminApi.inventory.adjust(product._id, {
        type,
        quantity: Number(quantity),
        reason,
      });
      toast.success(res.message);
      onDone();
      setType('increase');
      setQuantity('');
      setReason('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const preview =
    type === 'increase'
      ? product.stock + (Number(quantity) || 0)
      : type === 'decrease'
        ? Math.max(product.stock - (Number(quantity) || 0), 0)
        : Number(quantity) || product.stock;

  return (
    <Modal open onClose={onClose} title={`Adjust Stock — ${product.name}`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ['increase', 'Increase', Plus],
            ['decrease', 'Decrease', Minus],
            ['set', 'Set Exact', X],
          ].map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setType(val)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                type === val ? 'bg-gold-500 text-black border-gold-500' : 'border-ink-700 text-ink-400 hover:border-gold-500'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <Input
          id="adj-qty"
          label={type === 'set' ? 'New Quantity *' : `Quantity to ${type} *`}
          type="number"
          min={type === 'decrease' ? 0 : undefined}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
        />

        <Textarea id="adj-reason" label="Reason *" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Restock delivery, damaged units, correction…" maxLength={300} />

        <div className="bg-ink-900/30 rounded-lg px-4 py-3 text-sm flex justify-between items-center border border-ink-800">
          <span className="text-ink-400">
            Current: <strong className="text-white">{product.stock}</strong> → New:
          </span>
          <strong className={`text-lg ${preview <= 0 ? 'text-red-500' : preview <= product.lowStockThreshold ? 'text-amber-500' : 'text-white'}`}>{preview}</strong>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={submit}>Apply Adjustment</Button>
        </div>
      </div>
    </Modal>
  );
}
