import { isValidDateString, getLocalDateString } from '../services/date-utils.js';

/**
 * CompletionLog entity representing a check-in event.
 */
export class CompletionLog {
  /**
   * @param {Object} params
   * @param {string} params.habitId
   * @param {string} params.date
   * @param {boolean} [params.completed=true]
   * @param {string} [params.completedAt]
   */
  constructor({ habitId, date, completed = true, completedAt }) {
    if (!habitId || typeof habitId !== 'string') {
      throw new Error('CompletionLog requires a valid habitId string.');
    }

    const checkDate = date || getLocalDateString();
    if (!isValidDateString(checkDate)) {
      throw new Error(`Invalid date string: ${checkDate}`);
    }

    this.habitId = habitId.trim();
    this.date = checkDate;
    this.completed = Boolean(completed);
    this.completedAt = completedAt || new Date().toISOString();
  }

  /**
   * Serializes CompletionLog to plain object.
   * @returns {{ habitId: string, date: string, completed: boolean }}
   */
  toJSON() {
    return {
      habitId: this.habitId,
      date: this.date,
      completed: this.completed
    };
  }
}
