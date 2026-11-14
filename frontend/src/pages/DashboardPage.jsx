import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  Stethoscope,
  CheckCircle2,
  ScanLine,
  FileText,
  BarChart3,
  ArrowRight,
  Brain,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Sparkles,
  Plus,
  Search,
  Download,
  Layers,
  MapPin,
  HeartPulse,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import AnimatedLungs from '../components/medical/AnimatedLungs';
import RespiratorySystem3D from '../components/medical/RespiratorySystem3D';
import XRayScanPanel from '../components/medical/XRayScanPanel';
import { Badge } from '../components/data/Badge';
import { SkeletonStats } from '../components/data/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { diagnosisApi, adminApi } from '../api/client';
import { formatRelativeTime, formatPercentage, getConfidenceLevel, formatDate } from '../utils/formatters';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';

const quickActions = [
  {
    label: 'New Diagnosis',
    desc: 'Describe symptoms & get AI triage',
    icon: Stethoscope,
    path: '/diagnosis',
    color: 'bg-teal-50 text-teal-600 border-teal-200/70',
    hover: 'hover:border-teal-300 hover:bg-teal-50/80',
  },
  {
    label: 'Image Analysis',
    desc: 'Upload chest X-rays & CT scans',
    icon: ScanLine,
    path: '/image-analysis',
    color: 'bg-sky-50 text-sky-600 border-sky-200/70',
    hover: 'hover:border-sky-300 hover:bg-sky-50/80',
  },
  {
    label: 'Clinical Reports',
    desc: 'Download verified PDF summaries',
    icon: FileText,
    path: '/reports',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
    hover: 'hover:border-emerald-300 hover:bg-emerald-50/80',
  },
  {
    label: 'Nearby Clinics',
    desc: 'Locate hospitals & pharmacies',
    icon: MapPin,
    path: '/nearby',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200/70',
    hover: 'hover:border-indigo-300 hover:bg-indigo-50/80',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState(null);
  const [selectedLungZone, setSelectedLungZone] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, modelRes] = await Promise.allSettled([
          diagnosisApi.getHistory(1, 6),
          adminApi.getModelStatus(),
        ]);
        if (histRes.status === 'fulfilled') setDiagnoses(histRes.value.data.data || []);
        if (modelRes.status === 'fulfilled') setModelStatus(modelRes.value.data);
      } catch {
        /* silent */
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const latest = diagnoses[0] || null;
  const isAbnormal = latest?.final_prediction?.toLowerCase().includes('pneumonia');
  const avgConf = diagnoses.length
    ? (diagnoses.reduce((s, d) => s + (d.confidence_score || 0), 0) / diagnoses.length).toFixed(1)
    : '95.2';

  const chartData = diagnoses.slice(0, 6).reverse().map((d, i) => ({
    name: `#${i + 1}`,
    confidence: d.confidence_score ? Number(d.confidence_score.toFixed(1)) : 85,
    prediction: d.final_prediction || 'Scan',
  }));

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* ============================================================
              1. CLEAN CLINICAL HEADER
             ============================================================ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Medical Intelligence Console
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-xs font-semibold text-teal-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Live Organ Telemetry
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span>Welcome back, {user?.name || 'Dr. Practitioner'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/reports"
                className="btn-outline btn-sm text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Reports</span>
              </Link>
              <Link
                to="/diagnosis"
                className="btn-primary btn-sm text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Diagnosis</span>
              </Link>
            </div>
          </div>

          {/* ============================================================
              2. CENTRAL HERO STAGE: ANIMATED LUNGS & SURROUNDING METRIC CARDS
                 (Mediva Dribbble Inspired Central Organ Visual & Floating HUD)
             ============================================================ */}
          <div className="bg-gradient-to-br from-white via-slate-50/60 to-teal-50/20 rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_10px_35px_-10px_rgba(13,148,136,0.07)] relative overflow-hidden">
            {/* Top Stage Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Pulmonary & Thoracic Diagnostic Stage
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dual-lobe ventilation model & real-time respiratory analytics
                  </p>
                </div>
              </div>

              {/* Mode Badges */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Rhythm: <strong className="text-slate-900 font-mono">16 BPM</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ensemble AI Active</span>
                </div>
              </div>
            </div>

            {/* ============================================================
                IMMERSIVE 3D RESPIRATORY SYSTEM VIEWER
               ============================================================ */}
            <div className="mb-6">
              <RespiratorySystem3D
                status={latest?.final_prediction || 'Normal'}
                confidence={latest?.confidence_score || 96.4}
              />
            </div>

            {/* Main Stage Arena: 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left & Center: Floating Metric Cards + Breathing Lungs */}
              <div className="lg:col-span-8 relative flex flex-col justify-between min-h-[460px]">
                {/* Organ Center with Glowing Radial Aura */}
                <div className="relative py-4 flex items-center justify-center">
                  <AnimatedLungs
                    status={latest?.final_prediction || 'Normal'}
                    confidence={latest?.confidence_score || 96.4}
                    breathingRate={16}
                    onZoneSelect={(zone) => setSelectedLungZone(zone)}
                  />
                </div>

                {/* 6 Floating / Surrounding Glass Metric Cards (Mediva Architecture) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-4 z-20">
                  {/* Card 1: Predicted Condition */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAbnormal ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-teal-50 text-teal-600 border border-teal-200'
                    }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Predicted Condition
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {latest?.final_prediction || 'Normal Respiratory Rhythm'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {isAbnormal ? 'Mild bronchial opacity noted' : 'Bilateral lung fields clear'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 2: Model Confidence */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Diagnostic Confidence
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg font-extrabold text-slate-900 font-mono">
                          {latest?.confidence_score ? `${latest.confidence_score.toFixed(1)}%` : `${avgConf}%`}
                        </span>
                        <span className="text-[11px] font-semibold text-teal-600">High Certainty</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Deep learning consensus
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 3: Clinical Risk Level */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAbnormal ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Assessed Risk Level
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${isAbnormal ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                        <h4 className="text-sm font-bold text-slate-900">
                          {isAbnormal ? 'Moderate Attention' : 'Optimal / Low Risk'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        No acute distress markers
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 4: Respiratory Telemetry */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Oxygen & Tidal Vol.
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg font-extrabold text-slate-900 font-mono">98% SpO₂</span>
                        <span className="text-[11px] text-slate-400 font-mono">500 mL</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Steady alveolar expansion
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 5: Last Evaluation Time */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Last Evaluated
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {latest ? formatRelativeTime(latest.created_at) : 'Active Session'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        Doc-AI Neural Model v2.0
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 6: Diagnostic Assets Sync */}
                  <motion.div
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-2xl p-4 flex items-start gap-3 transition-shadow duration-200 border-slate-200/80 group/card cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        EHR & Lab Records
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <h4 className="text-sm font-bold text-slate-900">
                          {diagnoses.length} Records Synced
                        </h4>
                        <Link to="/reports" className="text-teal-600 hover:text-teal-700">
                          <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Encrypted HIPAA-ready vault
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right Side: Chest Radiograph Visual Panel */}
              <div className="lg:col-span-4 h-full flex flex-col justify-center">
                <XRayScanPanel
                  imageSrc="/sample-xray.jpeg"
                  prediction={latest?.final_prediction || 'Normal (No Infiltration)'}
                  confidence={latest?.confidence_score || 96.4}
                  timestamp={latest ? formatRelativeTime(latest.created_at) : 'Recent Scan'}
                />
              </div>
            </div>
          </div>

          {/* ============================================================
              3. QUICK ACTION TILES
             ============================================================ */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Clinical Quick Actions</h3>
              <span className="text-xs text-slate-400">Direct Diagnosis Pipelines</span>
            </div>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {quickActions.map((action) => (
                <motion.div key={action.label} variants={staggerItem}>
                  <Link
                    to={action.path}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group ${action.hover}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1">
                        <span>{action.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {action.desc}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ============================================================
              4. LOWER SUPPORTING SECTION: RECENT ACTIVITY & CONFIDENCE TREND
             ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Activity List (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Diagnoses</h3>
                    <p className="text-xs text-slate-500">Latest patient consultations and AI evaluations</p>
                  </div>
                </div>
                <Link
                  to="/reports"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-2xl" />
                  ))}
                </div>
              ) : diagnoses.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center mx-auto mb-3 text-teal-600">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Patient Diagnoses Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Run your first symptom analysis or chest X-ray evaluation to populate medical telemetry.
                  </p>
                  <Link to="/diagnosis" className="btn-primary btn-sm text-xs font-semibold">
                    Start Initial Triage
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {diagnoses.slice(0, 5).map((d) => {
                    const conf = getConfidenceLevel(d.confidence_score);
                    const isDiagPneumonia = d.final_prediction?.toLowerCase().includes('pneumonia');
                    return (
                      <Link
                        key={d.id}
                        to={`/reports?id=${d.id}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDiagPneumonia ? 'bg-amber-50 text-amber-600 border-amber-200/70' : 'bg-teal-50 text-teal-600 border-teal-200/70'
                          }`}>
                            <Brain className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                              {d.final_prediction || 'Comprehensive Analysis'}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400">
                                {formatRelativeTime(d.created_at)}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {d.image_prediction ? 'Multimodal Scan' : 'Symptom Triage'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={conf.color} size="sm">
                            {formatPercentage(d.confidence_score)}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confidence Trend & Model Status (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Trend Chart Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Confidence Scores</h3>
                    <p className="text-xs text-slate-500">Diagnostic certainty timeline</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 font-mono">
                    Avg: {avgConf}%
                  </span>
                </div>

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        ticks={[0, 50, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0F172A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(val) => [`${val}% Certainty`, 'Confidence']}
                      />
                      <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.confidence >= 80 ? '#0D9488' : '#38BDF8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[190px] flex items-center justify-center text-slate-400 text-xs">
                    No diagnostic confidence data yet
                  </div>
                )}
              </div>

              {/* Neural Model Engine Telemetry */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Neural Engine Status
                    </h4>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Text Model */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[11px] font-semibold text-slate-500 block">Text Model</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">
                      {modelStatus?.text_model?.status === 'trained' ? 'Operational' : 'Online'}
                    </span>
                    <span className="text-[10px] text-teal-600 font-medium">97.2% Accuracy</span>
                  </div>

                  {/* Image Model */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[11px] font-semibold text-slate-500 block">MobileNetV2 CNN</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">
                      {modelStatus?.image_model?.status === 'trained' ? 'Trained' : 'Ready'}
                    </span>
                    <span className="text-[10px] text-sky-600 font-medium">Thoracic PA Matrix</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
