import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import { Input, FieldError } from '../../components/common/Input';
import { AuthShell, PasswordInput, useAfterAuth } from './shared';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const register = useAuthStore((s) => s.register);
  const afterAuth = useAfterAuth();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!/^[+\d][\d\s\-()]{5,19}$/.test(form.phone)) errs.phone = 'Enter a valid phone number';
    if (form.password.length < 6) errs.password = 'At least 6 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Include an uppercase letter';
    else if (!/\d/.test(form.password)) errs.password = 'Include a number';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const data = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success(`Welcome to VOLTIQ, ${data.data.user.firstName}!`);
      afterAuth(data.data.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join thousands of happy customers">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input id="firstName" label="First Name" required placeholder="John" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <Input id="lastName" label="Last Name" required placeholder="Doe" value={form.lastName} onChange={set('lastName')} />
            <FieldError message={errors.lastName} />
          </div>
        </div>
        <div>
          <Input id="email" label="Email" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
          <FieldError message={errors.email} />
        </div>
        <div>
          <Input id="phone" label="Phone" type="tel" required placeholder="+1 555 000 1234" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          <FieldError message={errors.phone} />
        </div>
        <PasswordInput label="Password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <FieldError message={errors.password} />
        <PasswordInput label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        <FieldError message={errors.confirmPassword} />

        <Button type="submit" size="lg" className="w-full !mt-6" icon={UserPlus}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-ink-500 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
