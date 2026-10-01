/**
 * Calendar and Date utilities for Simple Streak Tracker.
 * Operates on ISO calendar date strings ('YYYY-MM-DD') in the user's local timezone.
 */

/**
 * Returns a 'YYYY-MM-DD' string for the given Date object in local time.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates whether a string is a valid 'YYYY-MM-DD' calendar date.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Verify real date (handles leap years, differing month lengths)
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
}

/**
 * Adds an integer number of days to a 'YYYY-MM-DD' string.
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDays(dateStr, days) {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Calculates the difference in calendar days between two dates (b - a).
 * @param {string} dateStrA
 * @param {string} dateStrB
 * @returns {number}
 */
export function daysBetween(dateStrA, dateStrB) {
  if (!isValidDateString(dateStrA) || !isValidDateString(dateStrB)) {
    throw new Error(`Invalid date strings: ${dateStrA}, ${dateStrB}`);
  }
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Returns an array of 'YYYY-MM-DD' strings for the preceding N days ending at referenceDate.
 * Sorted chronologically (oldest to newest).
 * @param {number} n
 * @param {string} [referenceDate] Defaults to today in local time
 * @returns {string[]}
 */
export function getLastNDays(n, referenceDate = getLocalDateString()) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(referenceDate, -i));
  }
  return result;
}

/**
 * Formats a 'YYYY-MM-DD' string into a friendly user-facing label.
 * @param {string} dateStr
 * @param {Object} [options]
 * @returns {string}
 */
export function formatDateForDisplay(dateStr, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!isValidDateString(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, options);
}
