import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/layouts/AuthLayout';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { useAuth } from '../context/AuthContext';
import { GENDER_OPTIONS } from '../utils/constants';

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const getStrength = (pw) => {
    if (!pw || pw.length < 8) return { label: 'Weak', width: '33%', color: 'bg-danger' };
    let s = 0;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    if (s >= 3) return { label: 'Strong', width: '100%', color: 'bg-success' };
    if (s >= 1) return { label: 'Medium', width: '66%', color: 'bg-warning' };
    return { label: 'Weak', width: '33%', color: 'bg-danger' };
  };

  const strength = getStrength(password);

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await authRegister(data.name, data.email, data.password, data.age ? Number(data.age) : undefined, data.gender || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your AI-powered diagnosis journey">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="alert-danger text-sm">{error}</motion.div>
        )}

        <Input label="Full Name" name="name" placeholder="John Doe" icon={User} register={register} required error={errors.name?.message} />
        <Input label="Email" name="email" type="email" placeholder="you@example.com" icon={Mail} register={register} required error={errors.email?.message} />
        <div>
          <Input label="Password" name="password" type="password" placeholder="Min 8 characters" icon={Lock} register={register} required error={errors.password?.message} />
          {password && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${strength.color}`} initial={{ width: 0 }} animate={{ width: strength.width }} transition={{ duration: 0.3 }} />
              </div>
              <p className={`text-xs mt-1 ${strength.color === 'bg-success' ? 'text-success' : strength.color === 'bg-warning' ? 'text-warning' : 'text-danger'}`}>{strength.label}</p>
            </div>
          )}
        </div>
        <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={Lock} register={register} required error={errors.confirmPassword?.message} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Age" name="age" type="number" placeholder="25" register={register} error={errors.age?.message} />
          <Select label="Gender" name="gender" options={GENDER_OPTIONS} register={register} placeholder="Select" />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
          <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-border bg-background text-primary focus:ring-primary/30" />
          <span className="text-sm text-text-secondary">I agree to the <span className="text-primary-400">Terms of Service</span> and <span className="text-primary-400">Privacy Policy</span></span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <span className="spinner spinner-sm" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
        </button>

        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}