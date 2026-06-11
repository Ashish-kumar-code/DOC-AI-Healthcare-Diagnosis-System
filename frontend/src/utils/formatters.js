// ============================================
// DOC-AI — Formatters & Display Utilities
// ============================================

import { CONFIDENCE_THRESHOLDS } from './constants';

/**
 * Format a date string to readable format: "Jan 15, 2025"
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string to readable datetime: "Jan 15, 2025 at 2:30 PM"
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date string to relative time: "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return formatDate(dateString);
}

/**
 * Format a number as percentage: "87.5%"
 */
export function formatPercentage(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format a number with commas: "1,234"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

/**
 * Format bytes to readable file size: "2.4 MB"
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

/**
 * Truncate text to maxLength with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get confidence level info
 */
export function getConfidenceLevel(score) {
  if (score == null) return { level: 'low', color: 'danger', label: 'Unknown' };
  const s = Number(score);
  if (s >= CONFIDENCE_THRESHOLDS.HIGH) return { level: 'high', color: 'success', label: 'High Confidence' };
  if (s >= CONFIDENCE_THRESHOLDS.MEDIUM) return { level: 'medium', color: 'warning', label: 'Medium Confidence' };
  return { level: 'low', color: 'danger', label: 'Low Confidence' };
}

/**
 * Get risk level from confidence
 */
export function getRiskLevel(confidence) {
  if (confidence == null) return { level: 'unknown', color: 'text-secondary', label: 'Unknown', bg: 'bg-white/10' };
  const c = Number(confidence);
  if (c >= 85) return { level: 'critical', color: 'text-danger', label: 'Critical', bg: 'bg-danger/15' };
  if (c >= 70) return { level: 'high', color: 'text-warning', label: 'High Risk', bg: 'bg-warning/15' };
  if (c >= 50) return { level: 'medium', color: 'text-primary', label: 'Moderate', bg: 'bg-primary/15' };
  return { level: 'low', color: 'text-success', label: 'Low Risk', bg: 'bg-success/15' };
}

/**
 * Get initials from full name: "Ashish Choubey" → "AC"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
