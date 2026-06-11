import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/layouts/AuthLayout';
import { Input } from '../components/forms/Input';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async () => {
    setLoading(true);
    // Simulate API call — no backend endpoint exists
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title={submitted ? '' : 'Reset your password'}
      subtitle={submitted ? '' : "Enter your email and we'll send you a reset link"}
    >
      {submitted ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary text-sm mb-8">We've sent a password reset link to your email address. Please check your inbox.</p>
          <Link to="/login" className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Email address" name="email" type="email" placeholder="you@example.com" icon={Mail}
            register={register} required error={errors.email?.message} />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <span className="spinner spinner-sm" /> : 'Send Reset Link'}
          </button>
          <p className="text-center">
            <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
