import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Download, Search, Loader2, FileText, CheckCircle } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { EmptyState } from '../components/data/EmptyState';
import { Badge } from '../components/data/Badge';
import { SkeletonCard } from '../components/data/SkeletonLoader';
import { diagnosisApi, reportApi } from '../api/client';
import { formatDate, formatPercentage, getConfidenceLevel } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';
import { useDebounce } from '../hooks/useDebounce';

export default function ReportGenerationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    diagnosisApi.getHistory(1, 50)
      .then((res) => setReports(res.data.data || []))
      .catch(() => {})
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
      const a = document.createElement('a'); a.href = url; a.download = `DOC_AI_Report_${id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { /* silent */ }
    setDownloading((p) => ({ ...p, [id]: false }));
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><FilePlus className="w-7 h-7 text-primary" /> Report Generation</h1>
            <p className="text-text-secondary mt-1">Download and manage diagnosis reports</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 input-sm" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No reports" description="Complete a diagnosis to generate reports." />
        ) : (
          <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
            {filtered.map((r) => {
              const conf = getConfidenceLevel(r.confidence_score);
              return (
                <motion.div key={r.id} variants={staggerItem} className="card-static flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{r.final_prediction || 'Diagnosis Report'}</p>
                      <p className="text-xs text-text-tertiary">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant={conf.color} size="sm">{formatPercentage(r.confidence_score)}</Badge>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(r.id)} disabled={downloading[r.id]}
                      className="btn-outline btn-sm">
                      {downloading[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      PDF
                    </button>
                    <button onClick={() => window.print()} className="btn-ghost btn-sm hidden sm:flex">Print</button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
}
