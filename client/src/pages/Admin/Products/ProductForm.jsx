import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, Save, Upload } from 'lucide-react';
import { adminApi } from '../../../services';
import Button from '../../../components/common/Button';
import { Input, Select, Textarea } from '../../../components/common/Input';

const EMPTY = {
  name: '',
  sku: '',
  brand: '',
  category: '',
  price: '',
  discountPrice: '',
  stock: 0,
  lowStockThreshold: 5,
  shortDescription: '',
  description: '',
  warranty: '',
  shippingInfo: '',
  images: [],
  specifications: [],
  features: [],
  variations: [],
  featured: false,
  bestseller: false,
  status: 'active',
};

function Section({ title, children }) {
  return (
    <section className="border border-ink-800 rounded-xl p-5">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-4">{title}</h4>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function ProductForm({ product, categories, onDone }) {
  const isEdit = !!product;
  const [form, setForm] = useState(() => (isEdit ? normalize(product) : { ...EMPTY }));
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const submit = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.brand.trim() || !form.category)
      return toast.error('Name, SKU, brand and category are required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!Number(form.price)) return toast.error('Price must be greater than zero');

    const payload = {
      name: form.name,
      sku: form.sku,
      brand: form.brand,
      category: form.category,
      price: Number(form.price),
      discountPrice: form.discountPrice === '' || form.discountPrice === null ? null : Number(form.discountPrice),
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      shortDescription: form.shortDescription,
      description: form.description,
      warranty: form.warranty,
      shippingInfo: form.shippingInfo,
      images: form.images.filter(Boolean),
      specifications: form.specifications.filter((s) => s.key && s.value),
      features: form.features.filter(Boolean),
      variations: form.variations.filter((v) => v.name && v.options.length),
      featured: form.featured,
      bestseller: form.bestseller,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) await adminApi.products.update(product._id, payload);
      else await adminApi.products.create(payload);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Basic */}
      <Section title="Basic Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="pf-name" label="Product Name *" value={form.name} onChange={set('name')} placeholder="Nova X Pro 5G" />
          <Input id="pf-sku" label="SKU *" value={form.sku} onChange={set('sku')} placeholder="SP-NVX-001" />
          <Input id="pf-brand" label="Brand *" value={form.brand} onChange={set('brand')} placeholder="Nexon" />
          <Select id="pf-category" label="Category *" value={form.category} onChange={set('category')}>
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      {/* Pricing + Inventory */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Section title="Pricing">
          <Input id="pf-price" label="Price ($) *" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
          <Input
            id="pf-discount" label="Discount Price ($)"
            type="number"
            min="0"
            step="0.01"
            value={form.discountPrice ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value === '' ? null : e.target.value }))}
            placeholder="Leave empty for no discount"
          />
        </Section>
        <Section title="Inventory">
          <Input id="pf-stock" label="Stock Quantity *" type="number" min="0" value={form.stock} onChange={set('stock')} />
          <Input id="pf-lowstock" label="Low Stock Threshold" type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
        </Section>
      </div>

      {/* Media */}
      <Section title="Media - Product Images">
        <ImageUrlsEditor images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
        <p className="text-[11px] text-ink-500">
          Upload from PC or paste image URLs. The first image is the primary product photo.
        </p>
      </Section>

      {/* Description */}
      <Section title="Description">
        <Input id="pf-shortdesc" label="Short Description" value={form.shortDescription} onChange={set('shortDescription')} maxLength={300} placeholder="One-liner shown on cards" />
        <Textarea id="pf-desc" label="Full Description *" rows={5} value={form.description} onChange={set('description')} placeholder="Tell the full story..." />
      </Section>

      {/* Specifications */}
      <Section title="Specifications">
        <KeyValueEditor
          rows={form.specifications}
          onChange={(specifications) => setForm((f) => ({ ...f, specifications }))}
          keyPlaceholder="RAM"
          valuePlaceholder="16GB"
          addLabel="Add Specification"
        />
      </Section>

      {/* Features + Variations */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Section title="Features">
          <ListEditor rows={form.features} onChange={(features) => setForm((f) => ({ ...f, features }))} placeholder="Adaptive 120Hz display" addLabel="Add Feature" />
        </Section>
        <Section title="Variations">
          <VariationsEditor rows={form.variations} onChange={(variations) => setForm((f) => ({ ...f, variations }))} />
        </Section>
      </div>

      {/* Additional */}
      <Section title="Additional">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="pf-warranty" label="Warranty" value={form.warranty} onChange={set('warranty')} placeholder="1 year manufacturer warranty" />
          <Input id="pf-shipping" label="Shipping Info" value={form.shippingInfo} onChange={set('shippingInfo')} placeholder="Free express shipping over $500..." />
          <Select id="pf-status" label="Status" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
        <div className="flex gap-6 pt-1">
          <Check label="Featured Product" checked={form.featured} onChange={() => setForm((f) => ({ ...f, featured: !f.featured }))} />
          <Check label="Best Seller" checked={form.bestseller} onChange={() => setForm((f) => ({ ...f, bestseller: !f.bestseller }))} />
        </div>
      </Section>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-[#111] pt-3 pb-1 -mx-1 px-1 border-t border-ink-800">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button icon={Save} loading={saving} onClick={submit}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </div>
  );
}

function normalize(p) {
  return {
    ...EMPTY,
    ...p,
    category: p.category?._id || p.category,
    discountPrice: p.discountPrice ?? '',
    specifications: [...(p.specifications || [])],
    features: [...(p.features || [])],
    images: [...(p.images || [])],
    variations: (p.variations || []).map((v) => ({ name: v.name, options: [...v.options] })),
  };
}

function ImageUrlsEditor({ images, onChange }) {
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    let currentImages = [...images];
    let successCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
        try {
          const { url } = await adminApi.upload(file);
          currentImages = [...currentImages, url];
          onChange(currentImages);
          successCount++;
        } catch (err) {
          errors.push(`${file.name}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded`);
      }
      if (errors.length > 0) {
        toast.error(`Upload issue: ${errors[0]}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-ink-800 group">
              <img src={src} alt="" className="w-full h-full object-cover bg-ink-900" onError={(e) => (e.currentTarget.src = '/placeholder.svg')} />
              <button
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                aria-label="Remove image"
                className="absolute inset-0 bg-black/60 text-white items-center justify-center hidden group-hover:flex transition-colors"
              >
                <X size={16} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-gold-500/90 text-black text-[9px] font-bold text-center py-0.5">PRIMARY</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...images, draft.trim()]);
                setDraft('');
              }
            }
          }}
          placeholder="https://images.unsplash.com/..."
          className="flex-1 border border-ink-700 bg-ink-900 text-white rounded-lg px-3.5 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...images, draft.trim()]);
            setDraft('');
          }}
        >
          Add URL
        </Button>
      </div>
      <label className="flex items-center justify-center gap-2 border border-dashed border-ink-700 rounded-lg px-4 py-3 text-sm text-ink-400 cursor-pointer hover:border-gold-500 hover:text-gold-400 transition-colors">
        <Upload size={15} />
        {uploading ? uploadProgress || 'Uploading...' : 'Upload from PC'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
      </label>
    </div>
  );
}

function KeyValueEditor({ rows, onChange, keyPlaceholder, valuePlaceholder, addLabel }) {
  const update = (i, field, val) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="w-36 sm:w-44 border border-ink-700 bg-ink-900 text-white rounded-lg px-3 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
          />
          <input
            value={row.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 min-w-0 border border-ink-700 bg-ink-900 text-white rounded-lg px-3 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
          />
          <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove row" className="px-2 text-ink-500 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...rows, { key: '', value: '' }])}>
        <Plus size={14} /> {addLabel}
      </Button>
    </div>
  );
}

function ListEditor({ rows, onChange, placeholder, addLabel }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-2.5">
      {rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 bg-ink-900/30 rounded-lg px-3 py-2 text-sm border border-ink-800">
              <span className="truncate">{item}</span>
              <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove" className="text-ink-500 hover:text-red-500 shrink-0">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...rows, draft.trim()]);
                setDraft('');
              }
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 border border-ink-700 bg-ink-900 text-white rounded-lg px-3 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...rows, draft.trim()]);
            setDraft('');
          }}
        >
          <Plus size={14} /> {addLabel}
        </Button>
      </div>
    </div>
  );
}

function VariationsEditor({ rows, onChange }) {
  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      {rows.map((v, i) => (
        <div key={i} className="border border-ink-800 rounded-lg p-3 space-y-2 bg-ink-900/20">
          <div className="flex gap-2 items-center">
            <input
              value={v.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Color / Storage / RAM..."
              className="flex-1 min-w-0 border border-ink-700 bg-ink-900 text-white rounded-lg px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
            />
            <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove variation" className="text-ink-500 hover:text-red-500">
              <X size={15} />
            </button>
          </div>
          <input
            value={v.options.join(', ')}
            onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="Options, comma separated (Black, Silver)"
            className="w-full border border-ink-700 bg-ink-900 text-white rounded-lg px-3 py-2 text-xs focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600"
          />
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...rows, { name: '', options: [] }])}>
        <Plus size={14} /> Add Variation Group
      </Button>
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={onChange}
        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
          checked ? 'bg-gold-500 border-gold-500' : 'bg-[#111] border-ink-700 hover:border-gold-500'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-3 h-3 fill-none stroke-black stroke-[2.5]">
            <path d="M1 4l3 3 5-6" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} readOnly className="sr-only" />
      <span className="text-sm font-medium text-white">{label}</span>
    </label>
  );
}
