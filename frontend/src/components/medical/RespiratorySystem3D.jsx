import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  RotateCcw,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Eye,
  Layers,
  Activity,
} from 'lucide-react';

/**
 * RespiratorySystem3D — Sketchfab-Powered Interactive 3D Organ Viewer
 *
 * Embeds the CevRiemann "Respiratory System (Animation) – Human Body Anatomy"
 * Sketchfab model (UID: b32c41dffc274a57aeffd45bc4ffc75a) as a fully
 * interactive, autoplay-animated, orbitable 3D viewer inside the Mediva
 * clinical dashboard.
 *
 * Features:
 *  - Autostart + autoplay breathing/diaphragm animation
 *  - Clean embed: no Sketchfab UI chrome (controls, info, help, inspector, VR hidden)
 *  - Slow auto-spin when idle
 *  - Expand/collapse fullscreen toggle
 *  - Transparent background → blends into the dashboard card
 *  - Responsive & mobile-friendly
 */

const MODEL_UID = 'b32c41dffc274a57aeffd45bc4ffc75a';

// Build the clean-embed URL with all UI hidden, transparent BG, autostart, etc.
function buildEmbedUrl(uid, { autospin = 0.12 } = {}) {
  const params = new URLSearchParams({
    autostart: '1',
    animation_autoplay: '1',
    autospin: String(autospin),
    transparent: '1',
    // Hide all Sketchfab chrome
    ui_controls: '0',
    ui_infos: '0',
    ui_stop: '0',
    ui_animations: '0',
    ui_annotations: '0',
    ui_help: '0',
    ui_settings: '0',
    ui_vr: '0',
    ui_inspector: '0',
    ui_watermark_link: '0',
    ui_ar: '0',
    ui_ar_help: '0',
    ui_ar_qrcode: '0',
    preload: '1',
    // Camera
    camera: '0',
    scrollwheel: '1',
  });
  return `https://sketchfab.com/models/${uid}/embed?${params.toString()}`;
}

export default function RespiratorySystem3D({
  status = 'Normal',
  confidence = 94.8,
  onReady,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isAbnormal =
    status?.toLowerCase().includes('pneumonia') ||
    status?.toLowerCase().includes('abnormal');

  const embedUrl = buildEmbedUrl(MODEL_UID);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onReady?.();
  }, [onReady]);

  return (
    <motion.div
      layout
      className={`relative rounded-3xl overflow-hidden border shadow-lg transition-all duration-500 ${
        isAbnormal
          ? 'border-amber-200/60 shadow-amber-100/50'
          : 'border-teal-200/50 shadow-teal-100/40'
      } ${
        expanded
          ? 'fixed inset-4 z-50 bg-white/95 backdrop-blur-xl'
          : 'w-full aspect-[4/3.8] bg-gradient-to-b from-slate-50/80 via-white to-teal-50/30'
      } ${className}`}
    >
      {/* Ambient glow behind the viewer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full blur-[80px] opacity-30 ${
            isAbnormal ? 'bg-amber-300' : 'bg-teal-300'
          }`}
        />
      </div>

      {/* Loading skeleton while iframe initializes */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
              <Box className="absolute inset-0 m-auto w-6 h-6 text-teal-600" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600 tracking-wide">
              Loading 3D Respiratory Model…
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Interactive anatomy • Orbit to explore
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sketchfab Embed Iframe */}
      <iframe
        title="Respiratory System 3D – Human Body Anatomy"
        src={embedUrl}
        className="absolute inset-0 w-full h-full z-10"
        style={{ border: 'none' }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={handleLoad}
      />

      {/* Top-Left: Organ System Badge */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-teal-100 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isAbnormal ? 'bg-amber-400' : 'bg-teal-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAbnormal ? 'bg-amber-500' : 'bg-teal-500'
              }`}
            />
          </span>
          <span className="text-xs font-semibold text-slate-700 tracking-wide">
            3D Respiratory System
          </span>
          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded">
            LIVE
          </span>
        </motion.div>
      </div>

      {/* Top-Right: Controls */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
        {/* Expand / Collapse */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/70 shadow-sm flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-300 transition-all duration-150"
          title={expanded ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {expanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Bottom-Center: Interaction Hint */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white/90 text-[11px] font-medium shadow-lg">
              <RotateCcw className="w-3 h-3" />
              <span>Drag to orbit • Scroll to zoom • Click to inspect</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-Left: Diagnostic Telemetry Mini-Cards */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
            className="absolute bottom-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/60 shadow-sm text-[11px]">
              <Activity className="w-3 h-3 text-teal-600" />
              <span className="font-semibold text-slate-700">Status:</span>
              <span
                className={`font-bold ${
                  isAbnormal ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {isAbnormal ? 'Review' : 'Normal'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/60 shadow-sm text-[11px]">
              <Eye className="w-3 h-3 text-sky-600" />
              <span className="font-semibold text-slate-700">Confidence:</span>
              <span className="font-bold text-slate-900 font-mono">
                {confidence.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen backdrop close */}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[-1] bg-black/30 backdrop-blur-sm cursor-pointer"
          aria-label="Close fullscreen"
        />
      )}
    </motion.div>
  );
}
