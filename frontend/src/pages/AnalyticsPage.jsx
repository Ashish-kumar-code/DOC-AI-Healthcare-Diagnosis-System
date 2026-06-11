import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Activity, TrendingUp, FileText, Stethoscope } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { StatsCard } from '../components/data/StatsCard';
import { ChartCard } from '../components/data/ChartCard';
import { SkeletonStats, SkeletonChart } from '../components/data/SkeletonLoader';
import { diagnosisApi } from '../api/client';
import { CHART_COLORS } from '../utils/constants';
import { formatPercentage } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';

export default function AnalyticsPage() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diagnosisApi.getHistory(1, 100)
      .then((res) => setDiagnoses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Process data
  const diseaseMap = {};
  const confBuckets = { '0-40%': 0, '40-70%': 0, '70-100%': 0 };
  const monthMap = {};
  let totalConf = 0;

  diagnoses.forEach((d) => {
    const disease = d.final_prediction || 'Unknown';
    diseaseMap[disease] = (diseaseMap[disease] || 0) + 1;
    const c = d.confidence_score || 0;
    totalConf += c;
    if (c >= 70) confBuckets['70-100%']++;
    else if (c >= 40) confBuckets['40-70%']++;
    else confBuckets['0-40%']++;
    const month = d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'Unknown';
    monthMap[month] = (monthMap[month] || 0) + 1;
  });

  const diseaseData = Object.entries(diseaseMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
  const confData = Object.entries(confBuckets).map(([name, value]) => ({ name, value }));
  const monthData = Object.entries(monthMap).map(([month, count]) => ({ month, count }));
  const trendData = diagnoses.slice().reverse().map((d, i) => ({ index: i + 1, confidence: d.confidence_score || 0 }));
  const avgConf = diagnoses.length ? (totalConf / diagnoses.length).toFixed(1) : 0;
  const topDisease = diseaseData[0]?.name || 'N/A';

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><BarChart3 className="w-7 h-7 text-primary" /> Analytics</h1>
          <p className="text-text-secondary mt-1">Insights from your diagnosis history</p>
        </div>

        {/* Stats */}
        {loading ? <SkeletonStats /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Diagnoses" value={diagnoses.length} icon={Activity} color="primary" />
            <StatsCard title="Avg Confidence" value={`${avgConf}%`} icon={TrendingUp} color="success" delay={0.1} />
            <StatsCard title="Most Common" value={topDisease} icon={Stethoscope} color="secondary" delay={0.2} />
            <StatsCard title="This Month" value={monthData[monthData.length - 1]?.count || 0} icon={FileText} color="warning" delay={0.3} />
          </div>
        )}

        {/* Charts */}
        <motion.div className="grid md:grid-cols-2 gap-6" variants={staggerContainer} initial="initial" animate="animate">
          <motion.div variants={staggerItem}>
            <ChartCard title="Disease Distribution" subtitle="Top conditions diagnosed" loading={loading}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={diseaseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} stroke="none">
                    {diseaseData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ChartCard title="Confidence Trends" subtitle="Score progression over time" loading={loading}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="index" stroke="#6B7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                  <Area type="monotone" dataKey="confidence" stroke="#3B82F6" fill="url(#blue)" strokeWidth={2} />
                  <defs><linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ChartCard title="Monthly Reports" subtitle="Diagnosis count per month" loading={loading}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ChartCard title="Confidence Distribution" subtitle="Scores by range" loading={loading}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={confData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {confData.map((_, i) => <Cell key={i} fill={['#EF4444', '#F59E0B', '#10B981'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>
        </motion.div>
      </PageTransition>
    </DashboardLayout>
  );
}
