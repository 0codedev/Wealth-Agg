
import { Investment, InvestmentType } from '../types';
import { Trade } from '../database';

export const getCountdownToTarget = (targetDateStr: string) => {
  const targetDate = new Date(`${targetDateStr}T23:59:59`);
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, isExpired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, isExpired: false };
};

export const calculateProgress5L = (currentNetWorth: number, target: number) => {
  if (target === 0) return "0.0";
  const progress = (currentNetWorth / target) * 100;
  return Math.min(progress, 100).toFixed(1);
};

// --- Formatting Helpers (Moved from App.tsx to avoid Cycles) ---

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyPrecise = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyCompact = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

export const calculatePercentage = (part: number, total: number) => {
  if (!total || total === 0) return '0.0';
  return ((part / total) * 100).toFixed(1);
};

// --- Streak Calculator (Slump Buster) ---
export const calculateStreaks = (trades: Trade[]) => {
  // 1. Group PnL by Date
  const dailyPnL: Record<string, number> = {};
  trades.forEach(t => {
    const date = t.date; // YYYY-MM-DD
    dailyPnL[date] = (dailyPnL[date] || 0) + (t.pnl || 0);
  });

  // 2. Sort dates descending (newest first)
  const sortedDates = Object.keys(dailyPnL).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentWinStreak = 0;
  let currentLoseStreak = 0;

  // 3. Calculate current streak
  for (const date of sortedDates) {
    const pnl = dailyPnL[date];
    if (currentLoseStreak === 0 && currentWinStreak === 0) {
      // First day determines which streak we are checking
      if (pnl < 0) currentLoseStreak = 1;
      else if (pnl > 0) currentWinStreak = 1;
    } else if (currentLoseStreak > 0) {
      if (pnl < 0) currentLoseStreak++;
      else break; // Streak broken
    } else if (currentWinStreak > 0) {
      if (pnl > 0) currentWinStreak++;
      else break; // Streak broken
    }
  }

  // Find Best Trade for Slump Buster
  const bestTrade = trades.length > 0 ? trades.reduce((prev, current) => ((prev.pnl || 0) > (current.pnl || 0)) ? prev : current) : null;

  return { currentWinStreak, currentLoseStreak, bestTrade };
};

// --- Timezone Utilities (IST for Tax Compliance) ---

/**
 * Get current date in IST (Indian Standard Time) timezone.
 * Critical for tax deadline calculations to ensure consistency regardless of user's local timezone.
 */
export const getISTDate = (): Date => {
  const now = new Date();
  // IST is UTC+5:30
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // 5 hours 30 minutes in milliseconds
  return new Date(utc + istOffset);
};

/**
 * Calculate days difference between two dates, IST-aware.
 * @param fromDate Start date
 * @param toDate End date
 * @returns Number of days (rounded up)
 */
export const calculateDaysDiff = (fromDate: Date, toDate: Date): number => {
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days held for an asset based on purchase date (IST-aware).
 * @param dateStr Date string (ISO format or YYYY-MM-DD)
 * @returns Days held from purchase to today (IST)
 */
export const calculateDaysHeld = (dateStr: string): number => {
  const purchaseDate = new Date(dateStr);
  const today = getISTDate();
  const diff = Math.abs(today.getTime() - purchaseDate.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// --- Fiscal Year Utilities (Compliance) ---

export interface FiscalYearInfo {
  startDate: Date;
  endDate: Date;
  label: string; // "FY 24-25"
}

export const getFiscalYearRange = (offset: number = 0): FiscalYearInfo => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  // If Jan(0), Feb(1), Mar(2), the FY started in previous year
  // Example: March 2024 is part of FY 23-24. April 2024 is start of FY 24-25.
  const baseStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  const startYear = baseStartYear + offset;
  const endYear = startYear + 1;

  // FY Starts April 1st
  const startDate = new Date(startYear, 3, 1);
  // FY Ends March 31st of next year
  const endDate = new Date(endYear, 2, 31, 23, 59, 59);

  const label = `FY ${String(startYear).slice(2)}-${String(endYear).slice(2)}`;

  return { startDate, endDate, label };
};

// --- Image Compression & Blob Utilities ---

export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const scaleSize = MAX_WIDTH / img.width;

        // Resize logic: Keep aspect ratio, max width 1024px
        if (scaleSize < 1) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to WebP at 70% quality
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        }, 'image/webp', 0.7);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// IMPROVED: Synchronous, Offline-Safe, No-Fetch Blob Converter
export const base64ToBlob = (base64: string): Blob => {
  try {
    // Check if it has the data prefix
    const arr = base64.split(',');

    // Default to png if mime type is missing/invalid
    let mime = 'image/png';
    let bstr = '';

    if (arr.length > 1) {
      // Has prefix (e.g. data:image/png;base64,...)
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (mimeMatch) mime = mimeMatch[1];
      bstr = atob(arr[1]);
    } else {
      // Raw base64 string
      bstr = atob(arr[0]);
    }

    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Blob conversion failed", e);
    // Return empty blob to prevent crash, but log error
    return new Blob([], { type: 'image/png' });
  }
};
