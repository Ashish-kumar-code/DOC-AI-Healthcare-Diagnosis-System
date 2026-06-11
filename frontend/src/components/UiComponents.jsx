import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

// ---- Loading ----
export function Loading({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
  if (fullScreen) return <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">{content}</div>;
  return content;
}

// ---- Alert Base ----
function Alert({ type, icon: Icon, children, onDismiss, className = '' }) {
  const styles = {
    error: 'alert-danger', success: 'alert-success', warning: 'alert-warning', info: 'alert-info',
  };
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`${styles[type] || styles.info} ${className}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export function ErrorAlert({ message, onDismiss }) { return <Alert type="error" icon={AlertCircle} onDismiss={onDismiss}>{message}</Alert>; }
export function SuccessAlert({ message, onDismiss }) { return <Alert type="success" icon={CheckCircle} onDismiss={onDismiss}>{message}</Alert>; }
export function WarningAlert({ message }) { return <Alert type="warning" icon={AlertTriangle}>{message}</Alert>; }
export function InfoAlert({ message }) { return <Alert type="info" icon={Info}>{message}</Alert>; }

export function DisclaimerBanner() {
  return (
    <Alert type="warning" icon={AlertTriangle}>
      <strong>Medical Disclaimer:</strong> This AI system is for informational purposes only. Always consult a qualified healthcare professional for medical advice.
    </Alert>
  );
}

// ---- Button ----
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, icon: Icon, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary', secondary: 'btn-secondary', outline: 'btn-outline',
    danger: 'btn-danger', ghost: 'btn-ghost', success: 'btn-success',
  };
  const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' };
  return (
    <button className={`${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

// ---- Card ----
export function Card({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'card', bordered: 'card', highlight: 'card border-primary/20', glass: 'glass-card rounded-2xl p-6',
    static: 'card-static',
  };
  return <div className={`${variants[variant] || variants.default} ${className}`} {...props}>{children}</div>;
}

// ---- ConfidenceMeter ----
export function ConfidenceMeter({ value = 0, showLabel = true }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger';
  const label = pct >= 80 ? 'High' : pct >= 60 ? 'Medium' : 'Low';
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        {showLabel && <span className="text-xs text-text-secondary">{label} Confidence</span>}
        <span className="text-xs font-medium text-text-primary">{pct.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <motion.div className={`progress-bar-fill ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} style={{ background: undefined }}
        />
      </div>
    </div>
  );
}

// ---- TabButton ----
export function TabButton({ children, active, icon: Icon, onClick }) {
  return (
    <button onClick={onClick}
      className={`tab-button flex items-center gap-2 ${active ? 'active' : ''}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

// ---- FilePreview ----
export function FilePreview({ file, preview, onRemove }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-white">
      {preview && <img src={preview} alt="Preview" className="w-full h-32 object-contain bg-black/20" />}
      <div className="flex items-center justify-between p-2.5">
        <span className="text-xs text-text-secondary truncate">{file?.name}</span>
        {onRemove && (
          <button onClick={onRemove} className="p-1 rounded hover:bg-danger/10 text-text-tertiary hover:text-danger transition-colors" aria-label="Remove">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Label ----
export function Label({ children, required, htmlFor }) {
  return <label htmlFor={htmlFor} className={`label ${required ? 'label-required' : ''}`}>{children}</label>;
}

// ---- Badge (legacy) ----
export function Badge({ children, variant = 'primary' }) {
  const styles = {
    success: 'badge-success', danger: 'badge-danger', warning: 'badge-warning',
    primary: 'badge-primary', secondary: 'badge-secondary', neutral: 'badge-neutral',
  };
  return <span className={styles[variant] || styles.primary}>{children}</span>;
}
