import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Users, Brain, Loader2, CheckCircle, AlertCircle, Play, Database } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { StatsCard } from '../components/data/StatsCard';
import { Badge } from '../components/data/Badge';
import { SkeletonStats } from '../components/data/SkeletonLoader';
import { ErrorAlert, SuccessAlert } from '../components/UiComponents';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/client';
import { staggerContainer, staggerItem } from '../utils/animations';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    adminApi.getModelStatus()
      .then((res) => setModelStatus(res.data))
      .catch(() => setError('Failed to load model status'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const trainModel = async (type) => {
    setTraining((p) => ({ ...p, [type]: true }));
    setError(''); setSuccess('');
    try {
      if (type === 'text') await adminApi.trainTextModel(true);
      else if (type === 'image') await adminApi.trainImageModel(5);
      else await adminApi.trainAllModels(5);
      setSuccess(`${type} model training started successfully`);
      const res = await adminApi.getModelStatus();
      setModelStatus(res.data);
    } catch (err) { setError(err.response?.data?.message || `Failed to train ${type} model`); }
    setTraining((p) => ({ ...p, [type]: false }));
  };

  if (!isAdmin) return (
    <DashboardLayout><PageTransition>
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Access Denied</h2>
        <p className="text-text-secondary">You need admin privileges to access this page.</p>
      </div>
    </PageTransition></DashboardLayout>
  );

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><Shield className="w-7 h-7 text-primary" /> Admin Panel</h1>
          <p className="text-text-secondary mt-1">Manage models, users, and system status</p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

        {/* Stats */}
        {loading ? <SkeletonStats /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Text Model" value={modelStatus?.text_model?.status || 'Unknown'} icon={Brain} color="primary" />
            <StatsCard title="Image Model" value={modelStatus?.image_model?.status || 'Unknown'} icon={Brain} color="secondary" delay={0.1} />
            <StatsCard title="Text Accuracy" value={modelStatus?.text_model?.accuracy ? `${(modelStatus.text_model.accuracy * 1).toFixed(1)}%` : 'N/A'} icon={CheckCircle} color="success" delay={0.2} />
            <StatsCard title="System" value="Operational" icon={Server} color="success" delay={0.3} />
          </div>
        )}

        {/* Model Cards */}
        <motion.div className="grid md:grid-cols-2 gap-6 mb-6" variants={staggerContainer} initial="initial" animate="animate">
          {/* Text Model */}
          <motion.div variants={staggerItem} className="card-static">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Brain className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Text Model</h3>
                  <p className="text-xs text-text-tertiary">RandomForest Classifier</p>
                </div>
              </div>
              <Badge variant={modelStatus?.text_model?.status === 'trained' ? 'success' : 'warning'} dot pulse>
                {modelStatus?.text_model?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2 mb-4 text-sm text-text-secondary">
              <div className="flex justify-between"><span>Algorithm</span><span className="text-text-primary">{modelStatus?.text_model?.algorithm || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Accuracy</span><span className="text-text-primary">{modelStatus?.text_model?.accuracy ? `${(modelStatus.text_model.accuracy * 1).toFixed(1)}%` : 'N/A'}</span></div>
              <div className="flex justify-between"><span>Features</span><span className="text-text-primary">{modelStatus?.text_model?.features_count || 'N/A'}</span></div>
            </div>
            <button onClick={() => trainModel('text')} disabled={training.text} className="btn-primary btn-sm w-full justify-center">
              {training.text ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Retrain
            </button>
          </motion.div>

          {/* Image Model */}
          <motion.div variants={staggerItem} className="card-static">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center"><Brain className="w-5 h-5 text-secondary" /></div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Image Model</h3>
                  <p className="text-xs text-text-tertiary">MobileNetV2</p>
                </div>
              </div>
              <Badge variant={modelStatus?.image_model?.status === 'trained' ? 'success' : 'warning'} dot pulse>
                {modelStatus?.image_model?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2 mb-4 text-sm text-text-secondary">
              <div className="flex justify-between"><span>Architecture</span><span className="text-text-primary">{modelStatus?.image_model?.architecture || 'MobileNetV2'}</span></div>
              <div className="flex justify-between"><span>Input Size</span><span className="text-text-primary">{modelStatus?.image_model?.input_size || '224x224'}</span></div>
              <div className="flex justify-between"><span>Classes</span><span className="text-text-primary">{modelStatus?.image_model?.classes?.length || 'N/A'}</span></div>
            </div>
            <button onClick={() => trainModel('image')} disabled={training.image} className="btn-primary btn-sm w-full justify-center">
              {training.image ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Retrain
            </button>
          </motion.div>
        </motion.div>

        {/* Train All */}
        <div className="card-static flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Train All Models</h3>
            <p className="text-sm text-text-secondary">Retrain both text and image models simultaneously</p>
          </div>
          <button onClick={() => trainModel('all')} disabled={training.all} className="btn-secondary">
            {training.all ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Train All
          </button>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
