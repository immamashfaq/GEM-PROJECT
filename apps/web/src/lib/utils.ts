import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amount: number | null | undefined,
  currency: string = 'LKR',
): string {
  if (amount == null) return 'Price on request';

  if (currency === 'LKR') {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCarat(carat: number | string | null | undefined): string {
  if (carat == null) return 'N/A';
  const val = typeof carat === 'number' ? carat : parseFloat(carat as string);
  if (isNaN(val)) return 'N/A';
  return `${val.toFixed(2)} ct`;
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export function formatTimeRemaining(endDate: string | Date): string {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 'Ended';

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function getListingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FIXED_PRICE: 'Buy Now',
    NEGOTIABLE: 'Make Offer',
    TIMED_AUCTION: 'Auction',
    LIVE_AUCTION: 'Live Auction',
  };
  return labels[type] ?? type;
}

export function getNaturalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NATURAL: 'Natural',
    SYNTHETIC: 'Synthetic',
    LAB_GROWN: 'Lab Grown',
  };
  return labels[status] ?? status;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
