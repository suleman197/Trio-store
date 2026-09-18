import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable } from '../../../components/admin/ui';
import Button from '../../../components/common/Button';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import { Input, Textarea } from '../../../components/common/Input';
import { Badge } from '../../../components/common/Badges';

export default function AdminCategories() {
  const { data: categories, loading, refetch } = useFetch(() => adminApi.categories.listAll(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggleActive = async (c) => {
    try {
      await adminApi.categories.update(c._id, { isActive: !c.isActive });
      toast.success(`Category ${!c.isActive ? 'enabled' : 'disabled'}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.categories.remove(deleteTarget._id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1100px]">
      <AdminPageHeader
        title="Categories"
        subtitle={`${categories?.length ?? '…'} categories`}
        action={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : (
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Category',
              render: (c) => (
                <div className="flex items-center gap-3">
                  <img
                    src={c.image}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-ink-900 border border-ink-800"
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-ink-500">/{c.slug}</p>
                  </div>
                </div>
              ),
            },
            { key: 'description', label: 'Description', render: (c) => <span className="text-ink-400 line-clamp-1 max-w-[280px] block">{c.description || '—'}</span> },
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
          rows={categories || []}
          empty="No categories yet"
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit — ${editing.name}` : 'Add Category'} size="sm">
        <CategoryForm category={editing} onDone={() => { setFormOpen(false); refetch(); }} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be removed. Categories with products cannot be deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function CategoryForm({ category, onDone }) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [image, setImage] = useState(category?.image || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (isEdit) await adminApi.categories.update(category._id, { name, description, image });
      else await adminApi.categories.create({ name, description, image });
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Smartphones" />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short description…" />
      <Input label="Image URL" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/…" />
      {image && (
        <img src={image} alt="" className="w-full h-36 object-cover rounded-xl border border-ink-800" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button loading={saving} onClick={submit}>{isEdit ? 'Save Changes' : 'Create Category'}</Button>
      </div>
    </div>
  );
}
