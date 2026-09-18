import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      <div className="text-center">
        <p className="text-[120px] leading-none font-extrabold tracking-tighter text-gold-500 select-none">404</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-white">Page not found</h1>
        <p className="mt-2 text-sm text-ink-400 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-gold-500 text-black px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors"
        >
          <Compass size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
