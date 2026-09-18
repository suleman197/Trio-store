import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Upload, ExternalLink, Globe, Phone, Mail, MapPin, Link2, Building2 } from 'lucide-react';
import { AdminPageHeader } from '../../../components/admin/ui';
import useSiteSettings from '../../../hooks/useSiteSettings.jsx';
import { adminApi } from '../../../services';

const TABS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'bank', label: 'Bank Payment', icon: Building2 },
  { id: 'social', label: 'Social Links', icon: Link2 },
  { id: 'footer', label: 'Footer', icon: ExternalLink },
];

export default function AdminSettings() {
  const { settings, setSettings } = useSiteSettings();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setForm(settings); }, [settings]);

  const set = (key, valOrEvent) => {
    const val = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setForm((f) => ({ ...f, [key]: val }));
  };
  const setSocial = (key, valOrEvent) => {
    const val = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: val } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.settings.update(form);
      setSettings((prev) => ({ ...prev, ...form }));
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await adminApi.upload(file);
      set('logoUrl', url);
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Site Settings"
        subtitle="Control your storefront branding, contact info, and content"
        action={
          <button onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-widest text-gold-500 hover:text-gold-400 transition-colors flex items-center gap-1">
            <ExternalLink size={12} /> View Storefront
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111] border border-ink-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-gold-500 text-black'
                : 'text-ink-400 hover:bg-ink-800 hover:text-white'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#111] border border-ink-800 rounded-xl p-6">
        {activeTab === 'general' && (
          <GeneralTab form={form} set={set} handleLogoUpload={handleLogoUpload} uploading={uploading} />
        )}
        {activeTab === 'contact' && (
          <ContactTab form={form} set={set} />
        )}
        {activeTab === 'bank' && (
          <BankTab form={form} set={set} />
        )}
        {activeTab === 'social' && (
          <SocialTab form={form} setSocial={setSocial} />
        )}
        {activeTab === 'footer' && (
          <FooterTab form={form} set={set} />
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-8 pt-6 border-t border-ink-800">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-gold-500 text-black text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- General Tab ---------- */
function GeneralTab({ form, set, handleLogoUpload, uploading }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Branding</SectionTitle>

      {/* Logo */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Store Logo</label>
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-ink-800 bg-ink-900" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gold-500 text-black flex items-center justify-center text-2xl font-extrabold">
              {form.brandName?.charAt(0) || 'V'}
            </div>
          )}
          <div className="flex-1">
            <label className="flex items-center gap-2 bg-ink-900 border border-ink-700 text-white text-sm px-4 py-2.5 rounded-lg cursor-pointer hover:border-gold-500 transition-colors">
              <Upload size={15} />
              {uploading ? 'Uploading...' : 'Upload from PC'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
            <p className="text-xs text-ink-500 mt-1.5">JPG, PNG, WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      <Input label="Brand Name" value={form.brandName} onChange={(v) => set('brandName', v)} placeholder="VOLTIQ" />
      <Input label="Tagline" value={form.tagline} onChange={(v) => set('tagline', v)} placeholder="Technology that moves you" />

      <SectionTitle>Announcement Bar</SectionTitle>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => set('announcementEnabled', !form.announcementEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.announcementEnabled ? 'bg-gold-500' : 'bg-ink-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.announcementEnabled ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-sm text-ink-400">{form.announcementEnabled ? 'Enabled' : 'Disabled'}</span>
      </div>
      <Textarea label="Announcement Text" value={form.announcementText} onChange={(v) => set('announcementText', v)} rows={2} />

      <SectionTitle>SEO</SectionTitle>
      <Input label="Meta Title" value={form.metaTitle} onChange={(v) => set('metaTitle', v)} placeholder="VOLTIQ — Premium Electronics Store" />
      <Textarea label="Meta Description" value={form.metaDescription} onChange={(v) => set('metaDescription', v)} rows={2} />
    </div>
  );
}

/* ---------- Contact Tab ---------- */
function ContactTab({ form, set }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Contact Information</SectionTitle>
      <Input label="Email" value={form.contactEmail} onChange={(v) => set('contactEmail', v)} icon={Mail} placeholder="support@voltiq.store" />
      <Input label="Phone" value={form.contactPhone} onChange={(v) => set('contactPhone', v)} icon={Phone} placeholder="+1 (555) 010-2020" />
      <Input label="Address" value={form.address} onChange={(v) => set('address', v)} icon={MapPin} placeholder="100 Circuit Avenue, San Francisco, CA" />
    </div>
  );
}

/* ---------- Bank Tab ---------- */
function BankTab({ form, set }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Bank Payment Details</SectionTitle>
      <p className="text-xs text-ink-500 mb-2">Customers who choose bank transfer will see these details. They receive a 20% discount for bank payments.</p>
      <Input label="Bank Name" value={form.bankName} onChange={(v) => set('bankName', v)} placeholder="HBL" />
      <Input label="Account Title" value={form.bankAccountTitle} onChange={(v) => set('bankAccountTitle', v)} placeholder="MUHAMMAD ADA" />
      <Input label="Account Number" value={form.bankAccountNumber} onChange={(v) => set('bankAccountNumber', v)} placeholder="09917902364499" />
      <Input label="Discount Percent" value={form.bankDiscountPercent} onChange={(v) => set('bankDiscountPercent', parseInt(v) || 0)} type="number" placeholder="20" />
    </div>
  );
}

/* ---------- Social Tab ---------- */
function SocialTab({ form, setSocial }) {
  const links = [
    { key: 'facebook', label: 'Facebook URL', icon: Link2 },
    { key: 'instagram', label: 'Instagram URL', icon: Link2 },
    { key: 'x', label: 'X (Twitter) URL', icon: XIcon },
    { key: 'youtube', label: 'YouTube URL', icon: Link2 },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle>Social Media Links</SectionTitle>
      {links.map(({ key, label, icon: Icon }) => (
        <Input
          key={key}
          label={label}
          value={form.socialLinks?.[key] || ''}
          onChange={(v) => setSocial(key, v)}
          icon={Icon}
          placeholder="https://..."
        />
      ))}
    </div>
  );
}

/* ---------- Footer Tab ---------- */
function FooterTab({ form, set }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Footer Content</SectionTitle>
      <Textarea label="About Text" value={form.aboutText} onChange={(v) => set('aboutText', v)} rows={3} />
      <Input label="Copyright Text" value={form.footerCopyright} onChange={(v) => set('footerCopyright', v)} placeholder="VOLTIQ. All rights reserved." />
    </div>
  );
}

/* ---------- Shared UI ---------- */
function SectionTitle({ children }) {
  return <h3 className="text-sm font-bold uppercase tracking-widest text-gold-400 mb-4">{children}</h3>;
}

function Input({ label, value, onChange, icon: Icon, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-ink-700 bg-ink-900 text-white rounded-lg py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600 ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-ink-700 bg-ink-900 text-white rounded-lg px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none placeholder:text-ink-600 resize-none"
      />
    </div>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} className={`w-[15px] h-[15px] ${props.className || ''}`}>
      <path d="M17.2 4h2.5l-5.5 6.3L20.7 20h-5.1l-4-5.2L7 20H4.5l5.9-6.7L4 4h5.2l3.6 4.8L17.2 4zm-.9 14.4h1.4L8.5 5.5H7l9.3 12.9z" fill="currentColor" />
    </svg>
  );
}
