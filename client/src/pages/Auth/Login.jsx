import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AuthShell, PasswordInput, useAfterAuth } from './shared';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const afterAuth = useAfterAuth();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    try {
      const guestCart = useCartStore.getState().items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        variant: i.variant,
      }));
      const data = await login(email, password, guestCart);
      // Clear local guest cart after merge
      if (guestCart.length) {
        useCartStore.setState({ items: [], subtotal: 0, itemCount: 0 });
      }
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      afterAuth(data.data.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account to continue">
      <form onSubmit={submit} className="space-y-5">
        <Input
          id="login-email"
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-xs font-medium text-ink-500 hover:text-black transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" icon={LogIn}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to VOLTIQ?{' '}
        <Link to="/register" className="font-semibold text-ink-500 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
