/**
 * Format date for display
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
// Central timezone used for displaying Supabase/Postgres timestamps
const TIMEZONE = 'Asia/Bangkok';

export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  
  try {
  const dateObj = normalizeToDate(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Format using centralized timezone
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: TIMEZONE
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date for relative display (e.g., "2 days ago")
 * @param {string|Date} date - The date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'Unknown time';
  
  try {
  const dateObj = normalizeToDate(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInMs = now - dateObj;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Unknown time';
  }
};

/**
 * Format date for short display (e.g., "Jan 15, 2024")
 * @param {string|Date} date - The date to format
 * @returns {string} - Short formatted date string
 */
export const formatShortDate = (date) => {
  if (!date) return 'Unknown';
  
  try {
  const dateObj = normalizeToDate(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid';
    }
    
    // Use centralized timezone for consistent display in Thailand
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: TIMEZONE
    });
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Invalid';
  }
};

/**
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date-time string
 */
export const formatDateTimeAt = (date) => {
  if (!date) return 'Unknown time';
  try {
  const d = normalizeToDate(date);
  if (isNaN(d.getTime())) return 'Invalid time';

  // Format components explicitly in Asia/Bangkok timezone
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE
  });

  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE
  });

  return `${datePart} at ${timePart}`;
  } catch (err) {
    console.error('Error formatting date-time:', err);
    return 'Unknown time';
  }
};

/**
 * Normalize various date input formats into a JavaScript Date object.
 * Handles:
 * - ISO strings with or without timezone
 * - Postgres-style 'YYYY-MM-DD HH:MM:SS' (treated as Asia/Bangkok +07:00)
 * - Numeric timestamps
 */
const normalizeToDate = (input) => {
  if (!input) return new Date(NaN);

  // If already a Date
  if (input instanceof Date) return input;

  // If numeric string or number (milliseconds or seconds)
  if (typeof input === 'number' || /^[0-9]+$/.test(String(input))) {
    const num = Number(input);
    // If looks like seconds (10 digits), convert to ms
    if (String(num).length === 10) return new Date(num * 1000);
    return new Date(num);
  }

  // Normalize Postgres timestamp without timezone 'YYYY-MM-DD HH:MM:SS'
  // to ISO by replacing space with 'T' and appending an explicit +07:00
  // offset so it is interpreted as Asia/Bangkok instant.
  if (typeof input === 'string') {
    const trimmed = input.trim();

    // Handle common Postgres format: 2023-12-31 15:04:05
    // Treat timestamps without timezone as Asia/Bangkok (+07:00)
    const pgLike = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    if (pgLike.test(trimmed)) {
      // Convert to ISO with explicit +07:00 offset so Date parses as the correct instant
      return new Date(trimmed.replace(' ', 'T') + '+07:00');
    }

    // If string includes timezone or 'T', let Date parse it (ISO)
    return new Date(trimmed);
  }

  return new Date(NaN);
};
