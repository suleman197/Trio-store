export default function SectionHeader({ eyebrow, title, action, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-7 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-1.5">{eyebrow}</p>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}
