import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ViewAllLink({ to, label = 'View All' }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold border-b border-gold-500 pb-0.5
        text-gold-400 hover:text-gold-300 hover:border-gold-300 transition-colors shrink-0"
    >
      {label}
      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
