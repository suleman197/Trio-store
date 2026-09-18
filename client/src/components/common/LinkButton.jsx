import { Link } from 'react-router-dom';

export default function LinkButton({ to, children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-gold-500 text-black hover:bg-gold-400 border border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.15)]',
    secondary: 'bg-ink-900 text-white border border-ink-700 hover:border-gold-500',
    white: 'bg-white text-black border border-white hover:bg-ink-950',
    outlineWhite: 'bg-transparent text-gold-400 border border-gold-500/40 hover:border-gold-400',
  };
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-lg
        transition-all duration-200 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
