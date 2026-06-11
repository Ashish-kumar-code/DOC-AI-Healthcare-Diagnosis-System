import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, ScanLine, Brain, Download, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { TextArea } from '../components/forms/TextArea';
import { RangeSlider } from '../components/forms/RangeSlider';
import { FileUpload } from '../components/forms/FileUpload';
import { ProgressRing } from '../components/data/ProgressRing';
import { Badge } from '../components/data/Badge';
import { DisclaimerBanner, ErrorAlert, SuccessAlert } from '../components/UiComponents';
import { diagnosisApi, reportApi } from '../api/client';
import { SEVERITY_OPTIONS, GENDER_OPTIONS } from '../utils/constants';
import { getRiskLevel, formatPercentage } from '../utils/formatters';
import { fadeInUp } from '../utils/animations';

const TABS = [
  { key: 'text', label: 'Text Analysis', icon: Stethoscope },
  { key: 'image', label: 'Image Analysis', icon: ScanLine },
  { key: 'multimodal', label: 'Multimodal', icon: Brain },
];

export default function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [painLevel, setPainLevel] = useState(5);
  const [downloading, setDownloading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleImageSelect = (files) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be less than 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleTextSubmit = async (data) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await diagnosisApi.textDiagnosis(
        parseInt(data.age), data.gender, data.symptom_text,
        parseInt(data.duration_days), data.severity,
        data.temperature ? parseFloat(data.temperature) : undefined,
        painLevel
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  const handleImageSubmit = async () => {
    if (!imageFile) { setError('Please select an image'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('image_type', 'xray');
      const res = await diagnosisApi.imageDiagnosis(fd);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Image analysis failed');
    }
    setLoading(false);
  };

  const handleMultimodalSubmit = async (data) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('age', parseInt(data.age));
      fd.append('gender', data.gender);
      fd.append('symptom_text', data.symptom_text || '');
      fd.append('duration_days', parseInt(data.duration_days));
      fd.append('severity', data.severity);
      if (data.temperature) fd.append('temperature', parseFloat(data.temperature));
      fd.append('pain_level', painLevel);
      if (imageFile) {
        fd.append('file', imageFile);
        fd.append('image_type', 'xray');
      }
      const res = await diagnosisApi.multimodalDiagnosis(fd);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Multimodal analysis failed');
    }
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    const id = result?.diagnosis_id;
    if (!id) return;
    setDownloading(true);
    try {
      const res = await reportApi.downloadPdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `DOC_AI_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { setError('Failed to download report'); }
    setDownloading(false);
  };

  const handleNewDiagnosis = () => {
    setResult(null);
    setError('');
    removeImage();
    reset();
    setPainLevel(5);
  };

  const onSubmit = (data) => {
    if (activeTab === 'text') handleTextSubmit(data);
    else if (activeTab === 'multimodal') handleMultimodalSubmit(data);
  };

  // Get display data
  const disease = result?.prediction?.predicted_disease || result?.prediction?.predicted_class || result?.final_diagnosis?.disease || result?.prediction?.predicted_disease || 'Unknown';
  const confidence = result?.prediction?.confidence || result?.final_diagnosis?.confidence || result?.prediction?.confidence || 0;
  const advice = result?.advice;
  const risk = getRiskLevel(confidence);

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">AI Diagnosis</h1>
          <p className="text-text-secondary mt-1">Analyze symptoms or medical images with AI</p>
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-center">
                <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-text-primary font-medium text-lg">Analyzing...</p>
                <p className="text-text-secondary text-sm mt-1">Our AI is processing your data</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result View */}
        {result && !loading ? (
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <div className="card-static mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-8 p-4">
                <ProgressRing value={confidence} size={140} />
                <div className="text-center sm:text-left flex-1">
                  <Badge variant={risk.level === 'critical' ? 'danger' : risk.level === 'high' ? 'warning' : risk.level === 'medium' ? 'primary' : 'success'} size="lg">
                    {risk.label}
                  </Badge>
                  <h2 className="text-2xl font-bold text-text-primary mt-3">{disease}</h2>
                  <p className="text-text-secondary mt-1">Confidence: {formatPercentage(confidence)}</p>
                </div>
              </div>
            </div>

            {advice && (
              <div className="card-static mb-6">
                <h3 className="text-base font-semibold text-text-primary mb-3">Recommendations</h3>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{advice}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={handleDownloadPdf} disabled={downloading} className="btn-primary">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <button onClick={handleNewDiagnosis} className="btn-outline">
                <RefreshCw className="w-4 h-4" /> New Diagnosis
              </button>
            </div>

            <DisclaimerBanner />
          </motion.div>
        ) : !loading && (
          /* Form View */
          <>
            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            {/* Tabs */}
            <div className="tab-bar mb-6">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => { setActiveTab(key); setError(''); }}
                  className={`tab-button flex items-center gap-2 ${activeTab === key ? 'active' : ''}`}>
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Text Tab */}
            {activeTab === 'text' && (
              <motion.form key="text" variants={fadeInUp} initial="initial" animate="animate"
                onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <TextArea label="Describe your symptoms" name="symptom_text" placeholder="e.g., I have been experiencing headaches and fatigue..."
                      register={register} required maxLength={1000} rows={5} error={errors.symptom_text?.message} />
                    <Select label="Severity" name="severity" options={SEVERITY_OPTIONS} register={register} required placeholder="Select severity" error={errors.severity?.message} />
                    <Input label="Duration (days)" name="duration_days" type="number" placeholder="e.g., 7" register={register} required error={errors.duration_days?.message} />
                  </div>
                  <div className="space-y-4">
                    <Input label="Age" name="age" type="number" placeholder="e.g., 30" register={register} required error={errors.age?.message} />
                    <Select label="Gender" name="gender" options={GENDER_OPTIONS} register={register} required placeholder="Select gender" error={errors.gender?.message} />
                    <Input label="Temperature (°F)" name="temperature" type="number" placeholder="e.g., 98.6" register={register} error={errors.temperature?.message} />
                    <RangeSlider label="Pain Level" name="pain_level" min={0} max={10} value={painLevel} onChange={setPainLevel} />
                  </div>
                </div>
                <button type="submit" className="btn-primary btn-lg">
                  <Brain className="w-5 h-5" /> Analyze Symptoms
                </button>
              </motion.form>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <motion.div key="image" variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
                <FileUpload label="Upload Medical Image" description="X-Ray, MRI, or CT scan — PNG, JPG up to 5MB"
                  accept="image/*" maxSize={5 * 1024 * 1024} onFilesSelected={handleImageSelect}
                  currentFile={imageFile} preview={imagePreview} onRemove={removeImage} error={null} />
                <button onClick={handleImageSubmit} disabled={!imageFile} className="btn-primary btn-lg disabled:opacity-50">
                  <ScanLine className="w-5 h-5" /> Analyze Image
                </button>
              </motion.div>
            )}

            {/* Multimodal Tab */}
            {activeTab === 'multimodal' && (
              <motion.form key="multimodal" variants={fadeInUp} initial="initial" animate="animate"
                onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <TextArea label="Symptoms" name="symptom_text" placeholder="Describe your symptoms..." register={register} maxLength={1000} rows={4} />
                    <Input label="Age" name="age" type="number" placeholder="30" register={register} required error={errors.age?.message} />
                    <Select label="Gender" name="gender" options={GENDER_OPTIONS} register={register} required placeholder="Select" />
                    <Input label="Duration (days)" name="duration_days" type="number" placeholder="7" register={register} required />
                    <Select label="Severity" name="severity" options={SEVERITY_OPTIONS} register={register} required placeholder="Select" />
                  </div>
                  <div className="space-y-4">
                    <FileUpload label="Medical Image (optional)" accept="image/*" maxSize={5 * 1024 * 1024}
                      onFilesSelected={handleImageSelect} currentFile={imageFile} preview={imagePreview} onRemove={removeImage} />
                    <Input label="Temperature (°F)" name="temperature" type="number" placeholder="98.6" register={register} />
                    <RangeSlider label="Pain Level" name="pain_level" min={0} max={10} value={painLevel} onChange={setPainLevel} />
                  </div>
                </div>
                <button type="submit" className="btn-primary btn-lg">
                  <Brain className="w-5 h-5" /> Multimodal Analysis
                </button>
              </motion.form>
            )}
          </>
        )}
      </PageTransition>
    </DashboardLayout>
  );
}