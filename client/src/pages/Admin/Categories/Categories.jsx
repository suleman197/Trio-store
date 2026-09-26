import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Power, Upload, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../../services';
import useFetch from '../../../hooks/useFetch';
import { AdminPageHeader, DataTable } from '../../../components/admin/ui';
import Button from '../../../components/common/Button';
import Modal, { ConfirmDialog } from '../../../components/common/Modal';
import { Input, Textarea } from '../../../components/common/Input';
import { Badge } from '../../../components/common/Badges';
import { compressImage } from '../../../utils/imageCompressor';

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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit — ${editing.name}` : 'Add Category'} size="md">
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    setUploading(true);
    setUploadProgress('Compressing image...');

    try {
      // Compress image client-side to prevent network drop / large upload delays
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });

      setUploadProgress('Uploading...');
      const res = await adminApi.upload(compressed);

      if (res?.url) {
        setImage(res.url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Upload succeeded but no image URL was returned');
      }
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

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

      {/* Image Upload & Link Section */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-400">Category Image</label>

        {/* Existing / Selected Image Preview */}
        {image && (
          <div className="relative group mb-3 rounded-xl overflow-hidden border border-ink-800 bg-ink-900">
            <img
              src={image}
              alt="Category Preview"
              className="w-full h-44 object-cover bg-ink-950"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setImage('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-sm transition-colors shadow-lg"
              >
                <X size={14} /> Remove Image
              </button>
            </div>
            <button
              type="button"
              onClick={() => setImage('')}
              className="sm:hidden absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white"
              title="Remove image"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Device Upload Area (Mobile & PC) */}
        <label
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            uploading
              ? 'border-gold-500/50 bg-gold-500/5 text-gold-400 cursor-not-allowed pointer-events-none'
              : 'border-ink-700 bg-ink-900/50 hover:border-gold-500/80 hover:bg-ink-900/80 text-ink-300'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={24} className="animate-spin text-gold-500" />
              <p className="text-sm font-medium text-gold-400">{uploadProgress || 'Uploading...'}</p>
              <p className="text-xs text-ink-500">Please wait a moment</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center text-gold-500 mb-0.5">
                <Upload size={18} />
              </div>
              <p className="text-sm font-semibold text-white">Upload from Mobile / PC</p>
              <p className="text-xs text-ink-400">Click or tap to choose photo from gallery or files</p>
            </div>
          )}
        </label>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="h-px bg-ink-800 flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Or enter image URL</span>
          <div className="h-px bg-ink-800 flex-1" />
        </div>

        {/* Image URL Input */}
        <Input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.unsplash.com/…"
          disabled={uploading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-3">
        <Button variant="secondary" onClick={onDone} disabled={saving || uploading}>
          Cancel
        </Button>
        <Button loading={saving} disabled={uploading} onClick={submit}>
          {isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </div>
  );
}
