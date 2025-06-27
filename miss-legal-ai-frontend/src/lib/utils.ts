import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Currency formatting for Nigerian Naira
export const formatCurrency = (amount: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

// Text utilities
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const capitalizeWords = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Phone number formatting for Nigerian numbers
export const formatPhoneNumber = (phone: string) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Nigerian numbers
  if (cleaned.startsWith('234')) {
    // +234 format
    const formatted = cleaned.replace(/^234(\d{3})(\d{3})(\d{4})$/, '+234 $1 $2 $3');
    return formatted !== cleaned ? formatted : phone;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // 0xxx format
    const formatted = cleaned.replace(/^0(\d{3})(\d{3})(\d{4})$/, '0$1 $2 $3');
    return formatted !== cleaned ? formatted : phone;
  }
  
  return phone;
};

// Validation utilities
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidNigerianPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  // Nigerian numbers: +234xxxxxxxxxx or 0xxxxxxxxxx
  return (
    (cleaned.startsWith('234') && cleaned.length === 13) ||
    (cleaned.startsWith('0') && cleaned.length === 11)
  );
};

// URL utilities
export const buildApiUrl = (endpoint: string, baseUrl?: string) => {
  const base = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Local storage utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Audio utilities
export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// File size formatting
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Error handling utilities
export const getErrorMessage = (error: any) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'An unexpected error occurred';
};

// Language utilities
export const getLanguageDisplayName = (code: string) => {
  const languages = {
    'english': 'English',
    'pidgin': 'Nigerian Pidgin',
    'yoruba': 'Yorùbá',
    'hausa': 'Hausa',
    'igbo': 'Igbo',
  };
  
  return languages[code as keyof typeof languages] || code;
};

// Browser detection
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Currency formatting
export const formatNaira = (amount: number) => {
  return `₦${amount.toLocaleString('en-NG')}`;
};
