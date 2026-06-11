import { createContext, useContext } from 'react';

const COLORS = {
  background: '#0B1220',
  card: '#111827',
  surface: '#1E293B',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255,255,255,0.08)',
};

const ThemeContext = createContext(COLORS);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={COLORS}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
