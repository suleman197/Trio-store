export function Input({ label, error, required, className = '', id, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-400">
          {label} {required && <span className="text-ink-500">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-lg border bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500
          ${error ? 'border-red-500' : 'border-ink-700'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', id, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-400">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-white
          transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', id, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-400">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={4}
        className={`block w-full rounded-lg border bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 transition-colors
          focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20
          ${error ? 'border-red-500' : 'border-ink-700'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}

/** Inline form error (for manual validation messages) */
export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-400">{message}</p>;
}
