// ============================================
// DOC-AI — Validation Utilities
// ============================================

import { FILE_LIMITS } from './constants';

export function validateEmail(email) {
  if (!email) return { valid: false, message: 'Email is required' };
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return { valid: false, message: 'Please enter a valid email address' };
  if (email.length > 256) return { valid: false, message: 'Email must be less than 256 characters' };
  return { valid: true, message: '' };
}

export function validatePassword(password) {
  if (!password) return { valid: false, message: 'Password is required', strength: 'weak' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters', strength: 'weak' };
  if (password.length > 128) return { valid: false, message: 'Password must be less than 128 characters', strength: 'strong' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  return { valid: true, message: '', strength };
}

export function validateFile(file, options = {}) {
  const { maxSize = FILE_LIMITS.MAX_FILE_SIZE, acceptedTypes = FILE_LIMITS.ACCEPTED_IMAGE_TYPES } = options;

  if (!file) return { valid: false, message: 'Please select a file' };
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, message: `File size must be less than ${maxMB}MB` };
  }
  if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
    return { valid: false, message: `File type not supported. Accepted: ${acceptedTypes.join(', ')}` };
  }
  return { valid: true, message: '' };
}

export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}

export function validateAge(age) {
  if (age === null || age === undefined || age === '') return { valid: false, message: 'Age is required' };
  const num = Number(age);
  if (isNaN(num) || !Number.isInteger(num)) return { valid: false, message: 'Age must be a whole number' };
  if (num < 0 || num > 120) return { valid: false, message: 'Age must be between 0 and 120' };
  return { valid: true, message: '' };
}

export function validateSymptoms(text) {
  if (!text || text.trim().length === 0) return { valid: false, message: 'Please describe your symptoms' };
  if (text.trim().length < 10) return { valid: false, message: 'Please provide more detail (at least 10 characters)' };
  if (text.length > 1000) return { valid: false, message: 'Symptoms must be less than 1000 characters' };
  return { valid: true, message: '' };
}
