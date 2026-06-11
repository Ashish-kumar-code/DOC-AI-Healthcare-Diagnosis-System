import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const CONFIG = {
  success: { icon: CheckCircle, border: 'border-l-success', iconColor: 'text-success' },
  error: { icon: AlertCircle, border: 'border-l-danger', iconColor: 'text-danger' },
  warning: { icon: AlertTriangle, border: 'border-l-warning', iconColor: 'text-warning' },
  info: { icon: Info, border: 'border-l-primary', iconColor: 'text-primary' },
};

export function Toast({ id, type = 'info', message, onDismiss }) {
  const { icon: Icon, border, iconColor } = CONFIG[type] || CONFIG.info;
  return (
    <motion.div
      layout initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${border} bg-white border border-border shadow-soft-lg max-w-sm w-full`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
      <p className="text-sm text-text-primary flex-1">{message}</p>
      <button onClick={() => onDismiss?.(id)} className="text-text-tertiary hover:text-text-primary transition-colors shrink-0" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
