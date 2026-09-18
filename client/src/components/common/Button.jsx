import { isValidElement } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-gold-500 text-black hover:bg-gold-400 disabled:hover:bg-gold-500 border border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.15)]',
  secondary:
    'bg-ink-900 text-white border border-ink-700 hover:border-gold-500 hover:bg-ink-800 disabled:hover:border-ink-700',
  ghost: 'bg-transparent text-ink-400 hover:text-gold-400 hover:bg-ink-800 border border-transparent',
  danger: 'bg-transparent text-red-400 border border-red-800 hover:bg-red-950 hover:border-red-600',
  white: 'bg-white text-black border border-white hover:bg-ink-950',
  outlineWhite: 'bg-transparent text-gold-400 border border-gold-500/40 hover:border-gold-400 hover:bg-gold-500/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium tracking-tight
        transition-all duration-200 active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold-500 focus-visible:ring-offset-[#0a0a0a]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
      {!loading && Icon && (isValidElement(Icon) ? Icon : <Icon size={size === 'sm' ? 14 : 18} strokeWidth={2} />)}
      {children}
    </button>
  );
}
