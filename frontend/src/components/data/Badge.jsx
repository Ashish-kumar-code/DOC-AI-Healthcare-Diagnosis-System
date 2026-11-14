import React from 'react';

const VARIANT_MAP = {
  primary: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  secondary: 'bg-sky-50 text-sky-700 border border-sky-200/60',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const SIZE_MAP = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };

export function Badge({ children, variant = 'primary', size = 'md', dot, pulse }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${VARIANT_MAP[variant] || VARIANT_MAP.primary} ${SIZE_MAP[size]}`}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'success' ? 'bg-emerald-500' : variant === 'danger' ? 'bg-rose-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          }`} />}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'success' ? 'bg-emerald-500' : variant === 'danger' ? 'bg-rose-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
}
