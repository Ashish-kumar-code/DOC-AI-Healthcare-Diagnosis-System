// ============================================
// DOC-AI — Application Constants
// ============================================

export const APP_NAME = 'DOC-AI';
export const APP_VERSION = '2.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  DIAGNOSIS: '/diagnosis',
  IMAGE_ANALYSIS: '/image-analysis',
  REPORTS: '/reports',
  REPORT_GENERATION: '/report-generation',
  ANALYTICS: '/analytics',
  NEARBY: '/nearby',
  PROFILE: '/profile',
  ADMIN: '/admin',
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  ACCEPTED_DOC_TYPES: ['application/pdf'],
};

// Form Options
export const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const PLACE_TYPES = [
  { value: 'hospital', label: 'Hospital', icon: 'Building2' },
  { value: 'doctor', label: 'Doctor / Clinic', icon: 'Stethoscope' },
  { value: 'pharmacy', label: 'Pharmacy', icon: 'Pill' },
];

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  LOW: 40,
  MEDIUM: 60,
  HIGH: 80,
};

// Chart Colors
export const CHART_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#14B8A6',
];

// Sidebar Nav Items
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/diagnosis', label: 'Diagnosis', icon: 'Stethoscope' },
  { path: '/image-analysis', label: 'Image Analysis', icon: 'ScanLine' },
  { path: '/reports', label: 'Reports', icon: 'FileText' },
  { path: '/report-generation', label: 'Generate Report', icon: 'FilePlus' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { path: '/nearby', label: 'Nearby', icon: 'MapPin' },
];

// Image Types for Upload
export const IMAGE_TYPES = [
  { value: 'xray', label: 'X-Ray', description: 'Chest X-Ray images' },
  { value: 'mri', label: 'MRI', description: 'MRI scan images' },
  { value: 'ct', label: 'CT Scan', description: 'CT scan images' },
];
