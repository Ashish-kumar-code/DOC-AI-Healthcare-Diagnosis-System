export function ChartCard({ title, subtitle, children, loading, action, className = '' }) {
  if (loading) {
    return <div className={`card-static ${className}`}><div className="skeleton-chart" /></div>;
  }
  return (
    <div className={`card-static ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-sm text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
