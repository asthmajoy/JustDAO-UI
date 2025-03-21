import { ethers } from 'ethers';

// Format address to truncated form (0x1234...5678)
export function formatAddress(address, start = 6, end = 4) {
  if (!address) return '';
  if (!ethers.utils.isAddress(address)) return address;
  
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

// Format ethers BigNumber to human-readable string with specified decimals
export function formatBigNumber(value, decimals = 18) {
  if (!value) return '0';
  
  try {
    return ethers.utils.formatUnits(value, decimals);
  } catch (error) {
    console.error('Error formatting BigNumber:', error);
    return '0';
  }
}

// Format a date to a human-readable string
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format a date to include time
export function formatDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format a timestamp to a relative time string (e.g., "2 hours ago")
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);
  
  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Format a timestamp to a countdown string (e.g., "2 days left")
export function formatCountdown(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = date - now;
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} left`;
  } else {
    return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} left`;
  }
}

// Format a number to a percentage string
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return '0%';
  
  return `${parseFloat(value).toFixed(decimals)}%`;
}

// Format a number with commas as thousands separators
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '0';
  
  return parseFloat(value)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}