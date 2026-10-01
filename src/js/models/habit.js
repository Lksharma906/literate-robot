import { getLocalDateString, isValidDateString } from '../services/date-utils.js';

/**
 * Habit entity representing a user habit.
 */
export class Habit {
  /**
   * @param {Object} params
   * @param {string} [params.id]
   * @param {string} params.name
   * @param {string} [params.createdAt]
   * @param {boolean} [params.archived]
   */
  constructor({ id, name, createdAt, archived = false }) {
    const validation = Habit.validateName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.id = id || Habit.generateId();
    this.name = name.trim();
    this.createdAt = createdAt && isValidDateString(createdAt) ? createdAt : getLocalDateString();
    this.archived = Boolean(archived);
  }

  /**
   * Validates a habit name.
   * @param {string} name
   * @returns {{ valid: boolean, error?: string }}
   */
  static validateName(name) {
    if (typeof name !== 'string') {
      return { valid: false, error: 'Habit name must be a string.' };
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Habit name cannot be empty.' };
    }
    if (trimmed.length > 60) {
      return { valid: false, error: 'Habit name must be 60 characters or fewer.' };
    }
    return { valid: true };
  }

  /**
   * Generates a unique habit ID.
   * @returns {string}
   */
  static generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `h_${timestamp}_${random}`;
  }

  /**
   * Serializes Habit to plain object.
   * @returns {{ id: string, name: string, createdAt: string, archived: boolean }}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      archived: this.archived
    };
  }
}
