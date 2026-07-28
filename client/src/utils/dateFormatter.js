/**
 * Format date for display
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
// Central timezone used for displaying Supabase/Postgres timestamps
const TIMEZONE = 'Asia/Bangkok';

/**
 * Format date for relative display (e.g., "2 days ago")
 * @param {string|Date} date - The date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'Unknown time';
  try {
    const d = normalizeToDate(date);
    if (isNaN(d.getTime())) return 'Invalid time';

    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // Use short forms for compact dashboard display
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeksInRange(days)) return `${Math.floor(days / 7)}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  } catch (err) {
    console.error('Error formatting relative date:', err);
    return 'Unknown time';
  }
};

const weeksInRange = (days) => days >= 7 && days < 30;

/**
 * Format date for short display (e.g., "Jan 15, 2024")
 * @param {string|Date} date - The date to format
 * @returns {string} - Short formatted date string
 */
export const formatShortDate = (date) => {
  if (!date) return 'Unknown';
  
  try {
    const d = normalizeToDate(date);
    if (isNaN(d.getTime())) return 'Invalid';

    // Short date: "11 September 2024" (day month year)
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
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

    // Format like "30 Aug 2025 at 13:45"
    const datePart = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
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
