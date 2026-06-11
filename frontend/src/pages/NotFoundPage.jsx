import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center max-w-md">
        <div className="text-8xl font-extrabold gradient-text bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Page not found</h1>
        <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Go Home</Link>
          <button onClick={() => window.history.back()} className="btn-outline"><ArrowLeft className="w-4 h-4" /> Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
