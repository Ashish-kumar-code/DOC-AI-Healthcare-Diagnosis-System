import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, LayoutDashboard, Stethoscope, ScanLine, FileText, FilePlus,
  BarChart3, MapPin, Settings, Shield, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ICON_MAP = {
  LayoutDashboard, Stethoscope, ScanLine, FileText, FilePlus,
  BarChart3, MapPin, Settings, Shield,
};

export default function Sidebar({ isCollapsed, onToggle, navItems, onMobileClose }) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const allItems = [
    ...navItems,
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: 'Shield' }] : []),
  ];

  return (
    <motion.aside
      className="h-screen bg-white border-r border-border flex flex-col sticky top-0"
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-text-primary whitespace-nowrap"
            >
              DOC-AI
            </motion.span>
          )}
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-text-secondary hover:text-text-primary lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scroll-area">
        {allItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-600' : 'text-text-tertiary group-hover:text-primary-600'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center w-full py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </motion.aside>
  );
}
