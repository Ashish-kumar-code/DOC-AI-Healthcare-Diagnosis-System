import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Upload, Brain, Loader2, Download } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { FileUpload } from '../components/forms/FileUpload';
import { ProgressRing } from '../components/data/ProgressRing';
import { Badge } from '../components/data/Badge';
import { ErrorAlert, DisclaimerBanner } from '../components/UiComponents';
import { diagnosisApi, reportApi } from '../api/client';
import { IMAGE_TYPES } from '../utils/constants';
import { getRiskLevel, formatPercentage } from '../utils/formatters';
import { fadeInUp } from '../utils/animations';

export default function ImageAnalysisPage() {
  const [imageType, setImageType] = useState('xray');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSelect = (files) => {
    const f = files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('File must be less than 5MB'); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setError('');
  };

  const removeFile = () => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); };

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload an image'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('image_type', imageType);
      const res = await diagnosisApi.imageDiagnosis(fd);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Analysis failed'); }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!result?.diagnosis_id) return;
    try {
      const res = await reportApi.downloadPdf(result.diagnosis_id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `DOC_AI_Report_${result.diagnosis_id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { setError('Download failed'); }
  };

  const disease = result?.prediction?.predicted_class || result?.prediction?.predicted_disease || 'Unknown';
  const confidence = result?.prediction?.confidence || 0;
  const risk = getRiskLevel(confidence);
  const probs = result?.prediction?.all_probabilities;

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><ScanLine className="w-7 h-7 text-secondary" /> Medical Image Analysis</h1>
          <p className="text-text-secondary mt-1">Upload X-rays, MRIs, or CT scans for AI-powered analysis</p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {result ? (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-static">
                {preview && <img src={preview} alt="Uploaded scan" className="w-full h-64 object-contain rounded-xl bg-black/20 mb-4" />}
                <p className="text-sm text-text-tertiary">Type: {imageType.toUpperCase()}</p>
              </div>
              <div className="card-static flex flex-col items-center justify-center text-center p-8">
                <ProgressRing value={confidence} size={140} />
                <Badge variant={risk.level === 'critical' || risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'success'} size="lg" className="mt-4">{risk.label}</Badge>
                <h2 className="text-2xl font-bold text-text-primary mt-3">{disease}</h2>
                <p className="text-text-secondary text-sm mt-1">{formatPercentage(confidence)} confidence</p>
              </div>
            </div>
            {probs && (
              <div className="card-static">
                <h3 className="text-base font-semibold text-text-primary mb-4">Class Probabilities</h3>
                {Object.entries(probs).map(([cls, prob]) => (
                  <div key={cls} className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-text-secondary w-24">{cls}</span>
                    <div className="flex-1 progress-bar"><div className="progress-bar-fill" style={{ width: `${prob}%`, background: prob > 50 ? '#3B82F6' : '#6B7280' }} /></div>
                    <span className="text-sm font-medium text-text-primary w-14 text-right">{formatPercentage(prob)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn-primary"><Download className="w-4 h-4" /> Download Report</button>
              <button onClick={() => { setResult(null); removeFile(); }} className="btn-outline">New Analysis</button>
            </div>
            <DisclaimerBanner />
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {IMAGE_TYPES.map((t) => (
                <button key={t.value} onClick={() => setImageType(t.value)}
                  className={`card-static text-left transition-all ${imageType === t.value ? 'border-primary/40 bg-primary/5' : 'hover:border-border-hover'}`}>
                  <div className="text-base font-semibold text-text-primary">{t.label}</div>
                  <div className="text-xs text-text-tertiary mt-1">{t.description}</div>
                </button>
              ))}
            </div>
            <FileUpload label="Upload Medical Image" description="PNG, JPG up to 5MB" accept="image/*"
              maxSize={5 * 1024 * 1024} onFilesSelected={handleSelect} currentFile={file} preview={preview} onRemove={removeFile} />
            <button onClick={handleAnalyze} disabled={!file || loading} className="btn-primary btn-lg disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
}
