import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-14 bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <span className="w-10 h-10 rounded-xl bg-gold-500 text-black flex items-center justify-center font-extrabold text-2xl">V</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">VOLTIQ</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-ink-500 mt-1.5">{subtitle}</p>
        </div>
        <div className="bg-[#111] border border-ink-800 rounded-2xl p-7 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

export function PasswordInput({ value, onChange, placeholder = '••••••••', label, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-600">{label}</label>}
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`block w-full rounded-lg border bg-ink-900 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-ink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 ${error ? 'border-red-500' : 'border-ink-700'}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-[38px] text-ink-400 hover:text-gold-400 transition-colors"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/** Shared post-login redirect + guest cart merge logic */
export function useAfterAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  return (user) => {
    const guestItems = useCartStore.getState().items;
    if (guestItems.length) {
      useCartStore
        .getState()
        .init()
        .then(() => {
          if (user.role !== 'admin') navigate(location.state?.from || '/');
          else navigate('/admin');
        });
    } else {
      navigate(user.role === 'admin' ? '/admin' : location.state?.from || '/');
    }
  };
}

export const inputIcon = { mail: Mail, lock: Lock };

export function useFormErrors() {
  const [errors, setErrors] = useState({});
  const set = (field, msg) => setErrors((e) => ({ ...e, [field]: msg }));
  return [errors, set];
}

export function useEffectOnce(fn) {
  useEffect(fn, []);
}
