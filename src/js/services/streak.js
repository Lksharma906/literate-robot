import {
  getLocalDateString,
  isValidDateString,
  addDays,
  daysBetween,
  getLastNDays
} from './date-utils.js';

/**
 * Calculates current streak, longest streak, and completion history for a habit.
 *
 * @param {Iterable<string>} completedDates - Iterable of 'YYYY-MM-DD' dates where habit was completed.
 * @param {string} [referenceDate] - Defaults to today's local date.
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   isCompletedToday: boolean,
 *   totalCompletions: number,
 *   rate30d: number,
 *   history30d: Array<{ date: string, completed: boolean }>
 * }}
 */
export function calculateStreakStats(completedDates, referenceDate = getLocalDateString()) {
  if (!isValidDateString(referenceDate)) {
    referenceDate = getLocalDateString();
  }

  // Filter valid dates and ensure no future dates
  const uniqueDates = new Set();
  if (completedDates) {
    for (const d of completedDates) {
      if (typeof d === 'string' && isValidDateString(d) && d <= referenceDate) {
        uniqueDates.add(d);
      }
    }
  }

  const isCompletedToday = uniqueDates.has(referenceDate);
  const yesterday = addDays(referenceDate, -1);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  if (isCompletedToday) {
    let checkDate = referenceDate;
    while (uniqueDates.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  } else if (uniqueDates.has(yesterday)) {
    let checkDate = yesterday;
    while (uniqueDates.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  } else {
    currentStreak = 0;
  }

  // 2. Calculate Longest Streak
  const sorted = Array.from(uniqueDates).sort();
  let longestStreak = 0;
  if (sorted.length > 0) {
    let currentRun = 1;
    let maxRun = 1;

    for (let i = 1; i < sorted.length; i++) {
      const diff = daysBetween(sorted[i - 1], sorted[i]);
      if (diff === 1) {
        currentRun++;
      } else if (diff > 1) {
        currentRun = 1;
      }
      if (currentRun > maxRun) {
        maxRun = currentRun;
      }
    }
    longestStreak = Math.max(maxRun, currentStreak);
  }

  // 3. Historical 30-Day Window
  const last30Dates = getLastNDays(30, referenceDate);
  let completedInLast30 = 0;
  const history30d = last30Dates.map(date => {
    const completed = uniqueDates.has(date);
    if (completed) completedInLast30++;
    return { date, completed };
  });

  const rate30d = Math.round((completedInLast30 / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    totalCompletions: uniqueDates.size,
    rate30d,
    history30d
  };
}
