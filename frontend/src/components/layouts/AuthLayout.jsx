import { motion } from 'framer-motion';
import { Brain, Shield, Zap, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel — Branding (hidden mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* CHANGED: Swapped dark gradient to a clean Light Sky Blue gradient combination */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-sky-100 to-white" />
        <div className="absolute inset-0 bg-dot-pattern opacity-20" />

        {/* Floating background ambient highlights tailored for a light layout */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/" className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <Brain className="w-7 h-7 text-white" />
              </div>
              {/* CHANGED: Modified to dark text for light background readability */}
              <span className="text-2xl font-bold text-slate-900">DOC-AI</span>
            </Link>

            {/* CHANGED: Made heading dark slate with a punchy deep blue gradient text emphasis */}
            <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
              AI-Powered Medical<br />
              <span className="gradient-text bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Diagnosis System</span>
            </h2>

            {/* CHANGED: Adjusted main description paragraph to slate-600 */}
            <p className="text-slate-600 text-lg mb-10 leading-relaxed font-medium">
              Advanced machine learning for instant, accurate health insights. Trusted by healthcare professionals worldwide.
            </p>

            <div className="space-y-5">
              {[
                { icon: Shield, text: 'Secure & HIPAA-ready data handling' },
                { icon: Zap, text: 'Instant AI analysis in seconds' },
                { icon: Activity, text: '95% prediction accuracy' },
              ].map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                >
                  {/* CHANGED: Swapped dark panels to crisp border cards */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-sky-200/60 shadow-sm flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  {/* CHANGED: Made line item subtext a dark slate-700 */}
                  <span className="text-slate-700 font-semibold text-sm">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">DOC-AI</span>
          </Link>

          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
              {subtitle && <p className="text-slate-600">{subtitle}</p>}
            </div>
          )}

          {children}
        </motion.div>
      </div>
    </div>
  );
}