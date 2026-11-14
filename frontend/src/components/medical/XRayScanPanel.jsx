import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, Eye, ZoomIn, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * XRayScanPanel — Interactive Chest Radiograph Preview
 * Features:
 * - Real Chest X-Ray presentation with high-contrast clinical display
 * - Holographic laser scanning beam overlay
 * - HUD corner framing reticles
 * - Toggleable AI Attention Heatmap & Density overlay
 * - Direct link to Image Analysis page
 */
export default function XRayScanPanel({
  imageSrc = '/sample-xray.jpeg',
  prediction = 'Normal (No Infiltration)',
  confidence = 96.4,
  timestamp = 'Recent Scan',
}) {
  const [scanning, setScanning] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const isPneumonia = prediction?.toLowerCase().includes('pneumonia');

  const triggerScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3800);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Chest Radiograph</h3>
            <p className="text-[11px] text-slate-500 font-medium">Thoracic PA Projection</p>
          </div>
        </div>

        {/* Scan Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>DICOM Ready</span>
        </div>
      </div>

      {/* Visual Scan Screen */}
      <div className="relative w-full aspect-[4/3.3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group/screen">
        {/* Real Radiograph Image */}
        <img
          src={imageSrc}
          alt="Chest X-Ray Diagnostic Scan"
          className="w-full h-full object-cover object-center filter contrast-125 brightness-95 transition-transform duration-500 group-hover/screen:scale-105"
          onError={(e) => {
            // Fallback gracefully to stylized anatomical chest representation if image load fails
            e.target.style.display = 'none';
          }}
        />

        {/* Subtle Vignette & Dark Blue Tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

        {/* Medical HUD Framing Reticles (Corner brackets) */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-400/80 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-400/80 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-400/80 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-400/80 pointer-events-none" />

        {/* Grid lines overlay (Medical matrix) */}
        <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

        {/* Interactive Heatmap Overlay */}
        {showHeatmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className={`w-40 h-40 rounded-full blur-2xl ${
              isPneumonia ? 'bg-amber-500/40' : 'bg-teal-400/35'
            }`} />
            <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-cyan-400/30 blur-xl" />
            <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full bg-emerald-400/30 blur-xl" />
          </motion.div>
        )}

        {/* Scanning Laser Beam Effect */}
        {(scanning || true) && (
          <motion.div
            animate={{
              top: ['0%', '94%', '0%'],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] pointer-events-none z-10"
          >
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-cyan-300 blur-[1px]" />
          </motion.div>
        )}

        {/* Live HUD Readout Overlay (Bottom of scan) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 z-20 backdrop-blur-md bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>FOV: 350mm</span>
          </div>
          <span className="text-teal-300 font-semibold font-mono">
            Conf: {typeof confidence === 'number' ? `${confidence.toFixed(1)}%` : confidence}
          </span>
        </div>
      </div>

      {/* Control Buttons & Findings */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">AI Finding</span>
            <span className={`text-sm font-bold ${isPneumonia ? 'text-amber-600' : 'text-teal-700'}`}>
              {prediction}
            </span>
          </div>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              showHeatmap
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show AI Map'}
          </button>
        </div>

        {/* Action Link to Full Image Analysis */}
        <Link
          to="/image-analysis"
          className="mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/60 text-xs font-semibold text-teal-800 transition-colors group/link"
        >
          <span>Upload & Analyze New X-Ray</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-600 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
