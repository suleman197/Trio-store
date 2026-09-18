import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { KeyRound, MailCheck } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AuthShell } from './shared';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.data?.resetToken) {
        setDevToken(data.data.resetToken);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="We'll generate a reset link for your account">
      {sent ? (
        <div className="text-center py-4">
          <MailCheck size={40} className="mx-auto text-ink-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-ink-600 leading-relaxed">
            If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been generated.
          </p>
          {devToken && (
            <Link
              to={`/reset-password?token=${devToken}`}
              className="mt-5 inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-ink-800 transition-colors"
            >
              Continue to Reset (dev mode)
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Input id="fp-email" label="Email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" className="w-full" loading={loading} icon={KeyRound}>
            Send Reset Link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-black hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
