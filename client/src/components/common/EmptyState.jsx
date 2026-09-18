import LinkButton from './LinkButton';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-ink-900 border border-ink-800 flex items-center justify-center mb-5">
          <Icon size={26} className="text-ink-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyStateLink({ to, label, ...props }) {
  return (
    <LinkButton to={to} variant="primary">
      {label}
    </LinkButton>
  );
}
