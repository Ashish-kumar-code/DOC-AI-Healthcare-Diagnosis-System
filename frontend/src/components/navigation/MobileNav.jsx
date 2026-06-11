import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, FileText, BarChart3, User } from 'lucide-react';

const items = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border z-40 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-tertiary'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
