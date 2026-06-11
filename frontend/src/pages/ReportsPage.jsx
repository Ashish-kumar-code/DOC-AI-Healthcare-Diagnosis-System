import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { ProgressRing } from '../components/data/ProgressRing';
import { EmptyState } from '../components/data/EmptyState';
import { SkeletonCard } from '../components/data/SkeletonLoader';
import { ErrorAlert, SuccessAlert } from '../components/UiComponents';
import { diagnosisApi, reportApi } from '../api/client';
import { formatRelativeTime, truncateText, getRiskLevel } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';
import { useDebounce } from '../hooks/useDebounce';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloading, setDownloading] = useState({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    diagnosisApi.getHistory(1, 50)
      .then((res) => setReports(res.data.data || []))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) =>
    !debouncedSearch || (r.final_prediction || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleDownload = async (id) => {
    setDownloading((p) => ({ ...p, [id]: true }));
    try {
      const res = await reportApi.downloadPdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `DOC_AI_Report_${id}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      setSuccess('Report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to download report'); }
    setDownloading((p) => ({ ...p, [id]: false }));
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><FileText className="w-7 h-7 text-primary" /> Reports</h1>
            <p className="text-text-secondary mt-1">{reports.length} diagnosis reports</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 input-sm" />
          </div>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No reports found" description={search ? 'Try a different search term' : 'Complete a diagnosis to see reports here.'} />
        ) : (
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={staggerContainer} initial="initial" animate="animate">
            {filtered.map((r) => {
              const risk = getRiskLevel(r.confidence_score);
              return (
                <motion.div key={r.id} variants={staggerItem} className="card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{r.final_prediction || 'Analysis'}</h3>
                      <p className="text-xs text-text-tertiary mt-0.5">{formatRelativeTime(r.created_at)}</p>
                    </div>
                    <ProgressRing value={r.confidence_score || 0} size={50} strokeWidth={4} showValue={false} />
                  </div>
                  {r.advice && <p className="text-xs text-text-secondary line-clamp-3 mb-4">{truncateText(r.advice, 120)}</p>}
                  <button onClick={() => handleDownload(r.id)} disabled={downloading[r.id]}
                    className="btn-outline btn-sm w-full justify-center">
                    {downloading[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download PDF
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
}