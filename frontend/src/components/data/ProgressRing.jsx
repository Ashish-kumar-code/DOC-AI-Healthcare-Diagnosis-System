import React from 'react';
import { motion } from 'framer-motion';

export function ProgressRing({ value = 0, size = 120, strokeWidth = 8, color, showValue = true, label, animate = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (value >= 80) return '#0D9488'; // Teal
    if (value >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(15, 23, 42, 0.08)" strokeWidth={strokeWidth} />
        {/* Progress circle */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${getColor()}30)` }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{Math.round(value)}%</span>
          {label && <span className="text-[10px] font-medium text-slate-400 mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  );
}
