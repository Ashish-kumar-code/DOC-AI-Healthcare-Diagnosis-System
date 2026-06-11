import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { border: 'border-l-success', icon: 'text-success', bg: 'bg-success/10' },
  error: { border: 'border-l-danger', icon: 'text-danger', bg: 'bg-danger/10' },
  warning: { border: 'border-l-warning', icon: 'text-warning', bg: 'bg-warning/10' },
  info: { border: 'border-l-primary', icon: 'text-primary', bg: 'bg-primary/10' },
};

function ToastItem({ id, type, message, onDismiss }) {
  const Icon = ICONS[type] || Info;
  const colors = COLORS[type] || COLORS.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colors.border} bg-white border border-border shadow-soft-lg max-w-sm w-full`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} />
      <p className="text-sm text-text-primary flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((type, message, duration = 5000) => {
    const id = ++idCounter;
    setNotifications((prev) => {
      const next = [...prev, { id, type, message }];
      return next.slice(-5); // Max 5 visible
    });
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const showSuccess = useCallback((message, duration) => addNotification('success', message, duration), [addNotification]);
  const showError = useCallback((message, duration) => addNotification('error', message, duration), [addNotification]);
  const showWarning = useCallback((message, duration) => addNotification('warning', message, duration), [addNotification]);
  const showInfo = useCallback((message, duration) => addNotification('info', message, duration), [addNotification]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning, showInfo, dismiss }}>
      {children}
      {/* Toast container - fixed bottom right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <ToastItem {...n} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
