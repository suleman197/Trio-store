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
        <div className="text-center py-4 space-y-4">
          <MailCheck size={44} className="mx-auto text-gold-500" strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-white">Reset Link Generated</h3>
          <p className="text-sm text-ink-400 leading-relaxed max-w-sm mx-auto">
            If an account exists for <span className="font-semibold text-white">{email}</span>, a password reset link has been created.
          </p>

          {devToken && (
            <div className="mt-6 border border-gold-500/30 bg-gold-500/10 rounded-xl p-5 text-center">
              <p className="text-xs text-gold-400 font-semibold mb-3">Click below to set your new password:</p>
              <Link
                to={`/reset-password?token=${devToken}`}
                className="inline-block bg-gold-500 text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-gold-600 transition-colors shadow-md"
              >
                Reset Password Now
              </Link>
            </div>
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
