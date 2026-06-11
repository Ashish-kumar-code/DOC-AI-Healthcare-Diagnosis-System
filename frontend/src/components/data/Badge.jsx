const VARIANT_MAP = {
  primary: 'bg-primary/15 text-primary-300',
  secondary: 'bg-secondary/15 text-secondary-300',
  success: 'bg-success/15 text-success-400',
  warning: 'bg-warning/15 text-warning-400',
  danger: 'bg-danger/15 text-danger-400',
  neutral: 'bg-slate-200 text-text-secondary',
};

const SIZE_MAP = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };

export function Badge({ children, variant = 'primary', size = 'md', dot, pulse }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${VARIANT_MAP[variant] || VARIANT_MAP.primary} ${SIZE_MAP[size]}`}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'success' ? 'bg-success' : variant === 'danger' ? 'bg-danger' : variant === 'warning' ? 'bg-warning' : 'bg-primary'
          }`} />}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'success' ? 'bg-success' : variant === 'danger' ? 'bg-danger' : variant === 'warning' ? 'bg-warning' : 'bg-primary'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
}
