import { motion } from 'framer-motion';

const COLOR_MAP = {
  primary: { icon: 'bg-primary/15 text-primary', trend: 'text-primary-400' },
  secondary: { icon: 'bg-secondary/15 text-secondary', trend: 'text-secondary-400' },
  success: { icon: 'bg-success/15 text-success', trend: 'text-success' },
  warning: { icon: 'bg-warning/15 text-warning', trend: 'text-warning' },
  danger: { icon: 'bg-danger/15 text-danger', trend: 'text-danger' },
};

export function StatsCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary', loading, delay = 0 }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;

  if (loading) {
    return (
      <div className="card-static">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-4 rounded" />
        </div>
        <div className="skeleton w-20 h-8 rounded mb-2" />
        <div className="skeleton w-24 h-4 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      className="card-static"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        {trend !== undefined && (
          <span className={`text-sm font-medium ${Number(trend) >= 0 ? 'text-success' : 'text-danger'}`}>
            {Number(trend) >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value mb-1">{value ?? '—'}</div>
      <div className="stat-label">{title}</div>
      {trendLabel && <div className="text-xs text-text-tertiary mt-1">{trendLabel}</div>}
    </motion.div>
  );
}
