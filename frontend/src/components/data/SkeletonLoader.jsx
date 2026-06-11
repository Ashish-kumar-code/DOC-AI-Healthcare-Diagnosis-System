export function SkeletonCard() {
  return <div className="skeleton h-40 w-full rounded-2xl" />;
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex gap-8">
        {[...Array(cols)].map((_, i) => <div key={i} className="skeleton w-20 h-3 rounded" />)}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="border-b border-border last:border-0 px-4 py-3 flex gap-8">
          {[...Array(cols)].map((_, j) => <div key={j} className="skeleton w-24 h-4 rounded" />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return <div className="skeleton h-64 w-full rounded-2xl" />;
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className={`skeleton h-4 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton w-32 h-4 rounded" />
        <div className="skeleton w-24 h-3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card-static space-y-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-20 h-8 rounded" />
          <div className="skeleton w-24 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}
