import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/layouts/AuthLayout';
import { Input } from '../components/forms/Input';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your DOC-AI account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="alert-danger text-sm">
            {error}
          </motion.div>
        )}

        <Input label="Email" name="email" type="email" placeholder="you@example.com" icon={Mail}
          register={register} required error={errors.email?.message} />
        <Input label="Password" name="password" type="password" placeholder="••••••••" icon={Lock}
          register={register} required error={errors.password?.message} />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/30" />
            <span className="text-sm text-text-secondary">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">Forgot password?</Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <span className="spinner spinner-sm" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="px-3 text-xs text-text-tertiary bg-background">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-outline justify-center text-sm py-2.5">Google</button>
          <button type="button" className="btn-outline justify-center text-sm py-2.5">GitHub</button>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}