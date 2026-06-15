import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Stethoscope, CheckCircle, ScanLine, FileText, BarChart3, ArrowRight, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { StatsCard } from '../components/data/StatsCard';
import { Badge } from '../components/data/Badge';
import { SkeletonStats } from '../components/data/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { diagnosisApi, adminApi } from '../api/client';
import { formatRelativeTime, formatPercentage, getConfidenceLevel } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';

const quickActions = [
  /* Adjusted gradients to have punchier color definitions for light background clarity */
  { label: 'New Diagnosis', desc: 'Analyze symptoms', icon: Stethoscope, path: '/diagnosis', color: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-600' },
  { label: 'Image Analysis', desc: 'Upload scans', icon: ScanLine, path: '/image-analysis', color: 'from-purple-500/15 to-purple-500/5', iconColor: 'text-purple-600' },
  { label: 'View Reports', desc: 'Past results', icon: FileText, path: '/reports', color: 'from-emerald-500/15 to-emerald-500/5', iconColor: 'text-emerald-600' },
  { label: 'Analytics', desc: 'View trends', icon: BarChart3, path: '/analytics', color: 'from-amber-500/15 to-amber-500/5', iconColor: 'text-amber-600' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, modelRes] = await Promise.allSettled([
          diagnosisApi.getHistory(1, 6),
          adminApi.getModelStatus(),
        ]);
        if (histRes.status === 'fulfilled') setDiagnoses(histRes.value.data.data || []);
        if (modelRes.status === 'fulfilled') setModelStatus(modelRes.value.data);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  const avgConf = diagnoses.length
    ? (diagnoses.reduce((s, d) => s + (d.confidence_score || 0), 0) / diagnoses.length).toFixed(1)
    : 0;

  const chartData = diagnoses.slice(0, 6).reverse().map((d, i) => ({
    name: `#${i + 1}`,
    confidence: d.confidence_score ? Number(d.confidence_score.toFixed(1)) : 0,
  }));

  return (
    <DashboardLayout>
      <PageTransition>
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-text-secondary mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats */}
        {loading ? <SkeletonStats /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Diagnoses" value={diagnoses.length} icon={Activity} color="primary" delay={0} />
            <StatsCard title="Avg Confidence" value={`${avgConf}%`} icon={TrendingUp} color="success" delay={0.1} />
            <StatsCard title="Latest Diagnosis" value={diagnoses[0]?.final_prediction || 'None'} icon={Stethoscope} color="secondary" delay={0.2} />
            <StatsCard title="System Status" value="Operational" icon={CheckCircle} color="success" delay={0.3} />
          </div>
        )}

        {/* UPDATED QUICK ACTIONS SECTION */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" variants={staggerContainer} initial="initial" animate="animate">
          {quickActions.map((a) => (
            <motion.div key={a.label} variants={staggerItem}>
              <Link 
                to={a.path} 
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/10 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                  <a.icon className={`w-5 h-5 ${a.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {a.label}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    {a.desc}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-3 card-static">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
              <Link to="/reports" className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : diagnoses.length === 0 ? (
              <div className="text-center py-10 text-text-tertiary text-sm">No diagnoses yet. Start your first analysis!</div>
            ) : (
              <div className="space-y-2">
                {diagnoses.slice(0, 5).map((d) => {
                  const conf = getConfidenceLevel(d.confidence_score);
                  return (
                    <Link key={d.id} to={`/reports?id=${d.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Brain className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{d.final_prediction || 'Analysis'}</p>
                          <p className="text-xs text-text-tertiary">{formatRelativeTime(d.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant={conf.color} size="sm">{formatPercentage(d.confidence_score)}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini Chart */}
          <div className="lg:col-span-2 card-static">
            <h2 className="text-base font-semibold text-text-primary mb-5">Confidence Scores</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="confidence" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-text-tertiary text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Model Status */}
        {modelStatus && (
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {['text_model', 'image_model'].map((key) => {
              const m = modelStatus[key];
              if (!m) return null;
              return (
                <div key={key} className="card-static flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{key === 'text_model' ? 'Text Model' : 'Image Model'}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{m.status || 'Unknown'}</p>
                  </div>
                  <Badge variant={m.status === 'trained' ? 'success' : 'warning'} dot pulse>{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : m.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
}