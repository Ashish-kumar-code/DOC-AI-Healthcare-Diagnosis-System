import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

/**
 * Loading fallback shown while lazy-loaded pages are being fetched.
 * Used as the Suspense fallback for React.lazy() page components.
 */
export default function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status" aria-label="Loading page">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <Brain className="w-7 h-7 text-white" />
        </motion.div>

        <div className="flex items-center gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </div>

        <p className="text-slate-400 text-sm mt-3 font-medium">Loading...</p>
      </motion.div>
    </div>
  );
}
