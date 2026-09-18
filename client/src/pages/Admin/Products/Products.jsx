import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Power, Search } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable, SearchBox } from '../../../components/admin/ui';
import Button from '../../../components/common/Button';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import { Input, Select, Textarea } from '../../../components/common/Input';
import { Badge } from '../../../components/common/Badges';
import ProductForm from './ProductForm';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => adminApi.products.list({ search: search || undefined, sort: 'newest', limit: 200 }),
    [search]
  );
  const categories = useFetch(() => adminApi.categories.listAll(), []);

  const toggleStatus = async (p) => {
    try {
      await adminApi.products.toggleStatus(p._id);
      toast.success(`Product ${p.status === 'active' ? 'disabled' : 'enabled'}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.products.remove(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1400px]">
      <AdminPageHeader
        title="Products"
        subtitle={`${data?.meta?.total ?? '…'} products in catalog`}
        action={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Product
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name, SKU, brand…" />
      </div>

      {loading ? (
        <div className="skeleton h-72 rounded-xl" />
      ) : (
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Product',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <img
                    src={p.images?.[0]}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover bg-ink-900 border border-ink-800 shrink-0"
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate max-w-[240px]">{p.name}</p>
                    <p className="text-xs text-ink-400">
                      {p.brand} · {p.sku}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: 'category',
              label: 'Category',
              render: (p) => p.category?.name || '—',
              mobileStrong: false,
            },
            {
              key: 'price',
              label: 'Price',
              align: 'right',
              render: (p) => (
                <div>
                  <p className="font-semibold">${(p.discountPrice ?? p.price).toFixed(2)}</p>
                  {p.discountPrice != null && <p className="text-[11px] text-ink-500 line-through">${Number(p.price).toFixed(2)}</p>}
                </div>
              ),
            },
            {
              key: 'stock',
              label: 'Stock',
              align: 'center',
              render: (p) => (
                <span className={`font-semibold ${p.stock <= 0 ? 'text-red-500' : p.stock <= p.lowStockThreshold ? 'text-amber-500' : ''}`}>
                  {p.stock}
                </span>
              ),
            },
            {
              key: 'flags',
              label: 'Flags',
              align: 'center',
              render: (p) => (
                <div className="flex justify-center gap-1 flex-wrap">
                  {p.featured && <Badge>Featured</Badge>}
                  {p.bestseller && <Badge tone="dark">Best</Badge>}
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              align: 'center',
              render: (p) => (
                <Badge tone={p.status === 'active' ? 'light' : 'outline'} className={p.status === 'active' ? '!bg-emerald-500/10 !text-emerald-500 !border-emerald-500/30' : ''}>
                  {p.status}
                </Badge>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (p) => (
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => toggleStatus(p)} title={p.status === 'active' ? 'Disable' : 'Enable'} className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors">
                    <Power size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    title="Edit"
                    className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-gold-500 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(p)} title="Delete" className="p-2 rounded-lg hover:bg-red-500/10 text-ink-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={data?.products || []}
          empty="No products found"
        />
      )}

      {/* Create / Edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit — ${editing.name}` : 'Add New Product'} size="xl">
        <ProductForm
          product={editing}
          categories={categories.data || []}
          onDone={() => {
            setFormOpen(false);
            refetch();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
