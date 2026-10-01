/**
 * LocalStorage safety cache for Simple Streak Tracker.
 * Mirrors working state to safeguard against accidental browser tab closure.
 */
const BACKUP_KEY = 'streak_tracker_backup_state';

export class LocalCache {
  /**
   * Saves state to browser localStorage.
   * @param {Object} data - { habits: Array, logs: Array }
   */
  static saveBackup(data) {
    if (typeof localStorage === 'undefined') return;
    try {
      const payload = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Unable to write to localStorage:', err);
    }
  }

  /**
   * Retrieves backed up state from localStorage.
   * @returns {{ timestamp: number, data: Object }|null}
   */
  static getBackup() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const item = localStorage.getItem(BACKUP_KEY);
      if (!item) return null;
      return JSON.parse(item);
    } catch (err) {
      console.warn('Unable to read from localStorage:', err);
      return null;
    }
  }

  /**
   * Clears backup from localStorage.
   */
  static clearBackup() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(BACKUP_KEY);
    } catch (err) {
      console.warn('Unable to clear localStorage:', err);
    }
  }
}
