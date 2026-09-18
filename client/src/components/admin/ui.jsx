export function StatCard({ icon: Icon, label, value, sub, tone = 'dark' }) {
  return (
    <div className="bg-[#111] border border-ink-800 rounded-xl p-5 hover:shadow-md hover:shadow-gold-500/5 transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
        </div>
        <span
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            tone === 'dark' ? 'bg-gold-500 text-black' : 'bg-ink-900 text-gold-400'
          }`}
        >
          <Icon size={19} strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

/** Responsive admin table — renders as stacked cards on small screens. */
export function DataTable({ columns, rows, keyField = '_id', empty = 'Nothing to show', renderCard }) {
  if (!rows?.length)
    return (
      <div className="text-center py-16 border border-dashed border-ink-800 rounded-xl bg-[#111]/50">
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto bg-[#111] border border-ink-800 rounded-xl">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-ink-500 ${
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((row) => (
              <tr key={row[keyField]} className="hover:bg-ink-900/30 transition-colors">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3.5 text-white ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((row) =>
          renderCard ? (
            <div key={row[keyField]} className="bg-[#111] border border-ink-800 rounded-xl p-4">
              {renderCard(row)}
            </div>
          ) : (
            <div key={row[keyField]} className="bg-[#111] border border-ink-800 rounded-xl p-4 space-y-2">
              {columns.map((c) => (
                <div key={c.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500 shrink-0 pt-0.5">{c.label}</span>
                  <span className={`text-right text-white ${c.mobileStrong ? 'font-semibold' : ''}`}>{c.render ? c.render(row) : row[c.key]}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}

export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-ink-700 bg-ink-900 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all w-full sm:w-64 ${className}`}
    />
  );
}
