import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { AuthShell, PasswordInput } from './shared';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset — please sign in');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token)
    return (
      <AuthShell title="Invalid reset link" subtitle="This password reset link is missing its token.">
        <Link to="/forgot-password" className="block w-full text-center bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-ink-800 transition-colors">
          Request a new link
        </Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Choose a new password" subtitle="Make it strong — at least 6 characters">
      <form onSubmit={submit} className="space-y-5">
        <PasswordInput label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <PasswordInput label="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={ShieldCheck}>
          Reset Password
        </Button>
      </form>
    </AuthShell>
  );
}
