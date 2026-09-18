import { useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';

export default function ScreenshotUpload({ onUpload, uploading }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!file) return;
    onUpload(file);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Payment screenshot" className="w-full max-h-80 object-contain rounded-xl border border-ink-800 bg-ink-900" />
          <button
            onClick={clear}
            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-lg text-white hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-ink-700 rounded-xl p-8 cursor-pointer hover:border-gold-500 hover:bg-ink-900/50 transition-all">
          <Upload size={28} className="text-ink-500 mb-3" />
          <p className="text-sm font-medium text-ink-400">Click to upload payment screenshot</p>
          <p className="text-xs text-ink-500 mt-1">JPG, PNG, WebP. Max 5MB.</p>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}

      {preview && (
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-gold-500 text-black text-sm font-bold py-3 rounded-xl hover:bg-gold-400 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <CheckCircle size={16} />
              Submit Payment Screenshot
            </>
          )}
        </button>
      )}
    </div>
  );
}
