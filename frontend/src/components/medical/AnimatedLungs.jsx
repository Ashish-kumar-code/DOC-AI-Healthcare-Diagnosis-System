import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wind, HeartPulse, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

/**
 * AnimatedLungs — Central Medical Visualization
 * Inspired by Mediva clinical organ dashboard aesthetic.
 * Features:
 * - Natural tidal breathing animation (expand/contract rhythm)
 * - Anatomical lung structure (trachea, bronchi, bronchial tree, lobes, pleura)
 * - Luminous respiratory particle flow
 * - Interactive pulmonary hotspots (Upper/Middle/Lower lobes)
 * - Status-reactive glowing effects (Healthy Teal vs Diagnostic Alert)
 */
export default function AnimatedLungs({
  status = 'Normal', // 'Normal' | 'Pneumonia' | 'Review' | 'Analyzing'
  confidence = 94.8,
  breathingRate = 16,
  onZoneSelect,
}) {
  const [activeZone, setActiveZone] = useState(null);
  const isAbnormal = status?.toLowerCase().includes('pneumonia') || status?.toLowerCase().includes('abnormal');

  // Diagnostic hotspots on the lung fields
  const hotspots = [
    { id: 'rul', name: 'Right Upper Lobe', x: 140, y: 130, status: 'Clear', o2: '99%' },
    { id: 'rml', name: 'Right Middle Lobe', x: 125, y: 195, status: isAbnormal ? 'Infiltration' : 'Clear', o2: isAbnormal ? '89%' : '98%', alert: isAbnormal },
    { id: 'rll', name: 'Right Lower Lobe', x: 155, y: 260, status: 'Clear', o2: '98%' },
    { id: 'lul', name: 'Left Upper Lobe', x: 260, y: 135, status: 'Clear', o2: '99%' },
    { id: 'lll', name: 'Left Lower Lobe', x: 245, y: 250, status: 'Clear', o2: '97%' },
  ];

  return (
    <div className="relative w-full max-w-[440px] aspect-[4/4.2] mx-auto flex items-center justify-center select-none">
      {/* Ambient Radial Glow Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`w-72 h-72 rounded-full blur-[70px] ${
            isAbnormal ? 'bg-amber-400/20' : 'bg-teal-400/25'
          }`}
        />
        <div className="absolute w-56 h-56 rounded-full bg-sky-400/15 blur-[50px]" />
      </div>

      {/* Decorative Outer Rings (HUD Aesthetics) */}
      <div className="absolute inset-2 rounded-full border border-teal-500/10 pointer-events-none" />
      <div className="absolute inset-8 rounded-full border border-dashed border-teal-500/15 animate-spin-slow pointer-events-none" />
      
      {/* Floating Organ Status Pill */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-100 shadow-sm text-xs font-semibold text-slate-700"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAbnormal ? 'bg-amber-400' : 'bg-teal-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAbnormal ? 'bg-amber-500' : 'bg-teal-500'}`} />
          </span>
          <span className="tracking-wide">Pulmonary Telemetry</span>
          <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-mono font-bold">
            {breathingRate} BPM
          </span>
        </motion.div>
      </div>

      {/* Breathing Organ SVG Container */}
      <motion.div
        animate={{
          scale: [0.96, 1.035, 0.96],
          y: [0, -3, 0],
        }}
        transition={{
          duration: 4.6,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 400 380"
          className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(13,148,136,0.12)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Lungs Gradient: Rich clinical teal & sky with translucent depth */}
            <linearGradient id="rightLungGrad" x1="60" y1="60" x2="190" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#0D9488" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.65" />
            </linearGradient>

            <linearGradient id="leftLungGrad" x1="210" y1="60" x2="340" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0D9488" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.65" />
            </linearGradient>

            {/* Inner Lung Tissue Glow */}
            <radialGradient id="lungInnerGlowRight" cx="130" cy="180" r="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="lungInnerGlowLeft" cx="270" cy="180" r="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#7DD3FC" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </radialGradient>

            {/* Infiltration Hotspot Gradient (if abnormal) */}
            <radialGradient id="alertGlow" cx="125" cy="195" r="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#EF4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>

            {/* Trachea & Airway Gradient */}
            <linearGradient id="tracheaGrad" x1="200" y1="20" x2="200" y2="135" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#0D9488" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="1" />
            </linearGradient>

            {/* Bronchi Branches Glow */}
            <filter id="bronchiGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ============================================================
              1. RIGHT LUNG (3 Lobes Anatomical Shape)
             ============================================================ */}
          <g className="cursor-pointer transition-opacity duration-300 hover:opacity-95">
            {/* Outer Pleural Glow Shadow */}
            <path
              d="M 188 120 C 180 85 155 60 128 65 C 95 72 70 105 60 145 C 48 190 45 240 60 280 C 72 312 95 335 125 338 C 150 340 175 320 185 285 C 190 268 188 160 188 120 Z"
              fill="url(#rightLungGrad)"
              stroke="#5EEAD4"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Inner Radiance Highlight */}
            <path
              d="M 180 125 C 172 95 150 75 130 80 C 105 85 82 115 75 150 C 65 190 62 235 75 270 C 85 295 105 315 130 318 C 150 320 170 300 178 270 C 182 250 180 160 180 125 Z"
              fill="url(#lungInnerGlowRight)"
            />

            {/* Lobe Fissure Lines (Horizontal & Oblique) */}
            <path
              d="M 60 175 C 95 185 135 180 185 190"
              stroke="#CCFBF1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />
            <path
              d="M 75 245 C 110 240 145 230 185 210"
              stroke="#CCFBF1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.5"
            />
          </g>

          {/* ============================================================
              2. LEFT LUNG (2 Lobes with Cardiac Notch)
             ============================================================ */}
          <g className="cursor-pointer transition-opacity duration-300 hover:opacity-95">
            {/* Outer Pleural Glow Shadow */}
            <path
              d="M 212 120 C 220 85 245 60 272 65 C 305 72 330 105 340 145 C 352 190 355 240 340 280 C 328 312 305 335 275 338 C 250 340 230 325 220 295 C 205 250 208 190 212 120 Z"
              fill="url(#leftLungGrad)"
              stroke="#7DD3FC"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Inner Radiance Highlight */}
            <path
              d="M 220 125 C 228 95 250 75 270 80 C 295 85 318 115 325 150 C 335 190 338 235 325 270 C 315 295 295 315 270 318 C 250 320 232 305 224 280 C 215 245 216 185 220 125 Z"
              fill="url(#lungInnerGlowLeft)"
            />

            {/* Oblique Fissure Line */}
            <path
              d="M 220 175 C 255 190 295 225 340 235"
              stroke="#E0F2FE"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.5"
            />
          </g>

          {/* ============================================================
              3. TRACHEA (Windpipe) & BRONCHIAL TREE
             ============================================================ */}
          {/* Main Trachea */}
          <g>
            <path
              d="M 194 25 L 194 118 C 194 125 197 132 200 135 C 203 132 206 125 206 118 L 206 25 Z"
              fill="url(#tracheaGrad)"
            />
            {/* Cartilage Ring Striations */}
            {[35, 47, 59, 71, 83, 95, 107].map((y) => (
              <line
                key={y}
                x1="193"
                y1={y}
                x2="207"
                y2={y}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeOpacity="0.75"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Bronchial Tree: Right and Left Main Bronchus */}
          <g filter="url(#bronchiGlow)">
            {/* Right Main Stem & Branches */}
            <path
              d="M 197 132 C 185 142 165 155 145 165 C 130 172 115 185 105 200"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
            <path
              d="M 165 155 C 158 140 148 128 135 120"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
            <path
              d="M 145 165 C 142 185 138 215 140 240"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M 135 120 C 120 115 108 118 95 125"
              stroke="#CCFBF1"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
            <path
              d="M 140 240 C 132 265 120 285 105 300"
              stroke="#CCFBF1"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />

            {/* Left Main Stem & Branches */}
            <path
              d="M 203 132 C 215 142 235 155 255 165 C 270 172 285 185 295 200"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
            <path
              d="M 235 155 C 242 140 252 128 265 120"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
            <path
              d="M 255 165 C 258 185 262 215 260 240"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M 265 120 C 280 115 292 118 305 125"
              stroke="#E0F2FE"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
            <path
              d="M 260 240 C 268 265 280 285 295 300"
              stroke="#E0F2FE"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
          </g>

          {/* ============================================================
              4. AIRFLOW PARTICLES (Gentle Inhalation/Exhalation motion)
             ============================================================ */}
          {[0, 1.2, 2.4, 3.6].map((delay, idx) => (
            <motion.circle
              key={idx}
              r="2"
              fill="#FFFFFF"
              initial={{ cx: 200, cy: 30, opacity: 0 }}
              animate={{
                cy: [30, 80, 130, idx % 2 === 0 ? 175 : 180],
                cx: [200, 200, 200, idx % 2 === 0 ? 140 : 260],
                opacity: [0, 0.9, 0.9, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* ============================================================
              5. INFECTION / DIAGNOSTIC HOTSPOT (If Pneumonia/Abnormal)
             ============================================================ */}
          {isAbnormal && (
            <g>
              <circle cx="125" cy="195" r="32" fill="url(#alertGlow)" />
              <motion.circle
                cx="125"
                cy="195"
                r="18"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                animate={{ r: [12, 26, 12], opacity: [0.8, 0.2, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="125" cy="195" r="4" fill="#EF4444" />
            </g>
          )}

          {/* ============================================================
              6. INTERACTIVE ANATOMICAL HOTSPOTS (Clickable zone inspect)
             ============================================================ */}
          {hotspots.map((spot) => {
            const isHovered = activeZone?.id === spot.id;
            return (
              <g
                key={spot.id}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setActiveZone(spot);
                  if (onZoneSelect) onZoneSelect(spot);
                }}
                onMouseLeave={() => setActiveZone(null)}
              >
                {/* Ping Ring */}
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r="7"
                  className={spot.alert ? 'fill-amber-400/30' : 'fill-teal-300/30'}
                />
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r="3.5"
                  className={`${
                    spot.alert ? 'fill-amber-500' : 'fill-teal-600'
                  } transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`}
                />
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r="1.5"
                  fill="#FFFFFF"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip / Hotspot Info Card */}
        <AnimatePresence>
          {activeZone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-6 px-3.5 py-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl pointer-events-none z-30 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-300">{activeZone.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activeZone.alert ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'
                }`}>
                  {activeZone.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Ventilation SpO₂: <span className="font-mono font-medium text-white">{activeZone.o2}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
