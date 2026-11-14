import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  Stethoscope,
  ScanLine,
  FileText,
  FilePlus,
  BarChart3,
  MapPin,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

const ICON_MAP = {
  LayoutDashboard,
  Stethoscope,
  ScanLine,
  FileText,
  FilePlus,
  BarChart3,
  MapPin,
  Settings,
  Shield,
};

// Helpful subtitle descriptions for the signature Dribbble tooltip exploration
const ITEM_DESCRIPTIONS = {
  '/dashboard': 'Overview & Vitals',
  '/diagnosis': 'AI Symptom Triage',
  '/image-analysis': 'Radiograph & CT Scan',
  '/reports': 'Clinical Records Archive',
  '/report-generation': 'Generate Verified PDF',
  '/analytics': 'Diagnostic Performance',
  '/nearby': 'Hospitals & Pharmacies',
  '/admin': 'System Administration',
};

export default function Sidebar({ isCollapsed, onToggle, navItems = [], onMobileClose }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const allItems = [
    ...navItems,
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: 'Shield' }] : []),
  ];

  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'Clinician';
  const userRole = isAdmin ? 'Medical Admin' : 'Attending Physician';
  const userInitials = getInitials(userName);

  return (
    <motion.aside
      className="h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 z-30 select-none shadow-[2px_0_16px_rgba(15,23,42,0.02)]"
      animate={{ width: isCollapsed ? 84 : 264 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ============================================================
          1. HEADER / LOGO SECTION
         ============================================================ */}
      <div className="h-20 flex items-center px-4 justify-between border-b border-slate-100/80">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          {/* Logo Mark: Gradient Teal/Emerald Hex-Rounded Icon */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>

          {/* Logo Typography (Hidden when collapsed) */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    DOC-AI
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 leading-none">
                    v2.0
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 mt-1 truncate">
                  Clinical Intelligence
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ============================================================
          2. NAVIGATION MENU (Clean Dribbble Aesthetic with Soft Mint Pills)
         ============================================================ */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Subtle Category Header (Expanded Only) */}
        {!isCollapsed && (
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400/90">
              Navigation
            </span>
          </div>
        )}

        {allItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;
          const description = ITEM_DESCRIPTIONS[item.path] || item.label;

          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                onClick={onMobileClose}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#EDF8F5] text-teal-900 font-semibold shadow-xs border border-teal-100/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active Indicator Accent Bar (Subtle left pill bar) */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-teal-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Menu Item Icon */}
                <div
                  className={`relative flex items-center justify-center transition-colors duration-200 ${
                    isActive
                      ? 'text-teal-600'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0 stroke-[1.85]" />
                </div>

                {/* Menu Item Label (Expanded Mode) */}
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap truncate tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>

              {/* ============================================================
                  3. DRIBBLE TOOLTIP EXPLORATION
                  Shows floating contextual card when collapsed or on item hover
                 ============================================================ */}
              <AnimatePresence>
                {isHovered && isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -6, scale: 0.95 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                  >
                    <div className="relative px-3.5 py-2 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/15 border border-slate-800 whitespace-nowrap min-w-[140px]">
                      {/* Tooltip Caret / Arrow pointing left */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-[6px] border-r-slate-900" />
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white tracking-tight">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-normal">
                        {description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ============================================================
          4. BOTTOM SECTION: USER PROFILE CARD & COLLAPSE TOGGLE
         ============================================================ */}
      <div className="p-3 border-t border-slate-100/90 flex flex-col gap-2">
        {/* User Profile Area (Matches Dribbble Bottom Card) */}
        <div
          className={`relative flex items-center gap-3 p-2 rounded-2xl transition-all duration-200 ${
            isCollapsed ? 'justify-center p-1.5' : 'bg-slate-50/70 border border-slate-100'
          }`}
        >
          {/* Avatar with Initials */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs shadow-xs border-2 border-white">
              {userInitials}
            </div>
            {/* Online Pulse Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          {/* User Name & Role (Expanded Mode) */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <div className="text-xs font-bold text-slate-900 truncate tracking-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {userRole}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-all duration-150 group"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 group-hover:text-slate-800">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
