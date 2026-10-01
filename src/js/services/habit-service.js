import { Habit } from '../models/habit.js';
import { CompletionLog } from '../models/completion.js';
import { calculateStreakStats } from './streak.js';
import { getLocalDateString } from './date-utils.js';

/**
 * HabitService coordinates in-memory state for habits and daily completions.
 */
export class HabitService {
  /**
   * @param {Object} [initialData]
   * @param {Array<Object>} [initialData.habits]
   * @param {Array<Object>} [initialData.logs]
   */
  constructor(initialData = { habits: [], logs: [] }) {
    this.habits = new Map(); // id -> Habit
    this.completions = new Map(); // habitId -> Set of date strings
    this.listeners = new Set();

    if (initialData) {
      this.importState(initialData);
    }
  }

  /**
   * Subscribes a listener to state changes.
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in HabitService subscriber:', err);
      }
    }
  }

  /**
   * Creates a new Habit.
   * @param {string} name
   * @returns {Habit}
   */
  createHabit(name) {
    const habit = new Habit({ name });
    this.habits.set(habit.id, habit);
    if (!this.completions.has(habit.id)) {
      this.completions.set(habit.id, new Set());
    }
    this.notify();
    return habit;
  }

  /**
   * Updates an existing Habit's attributes.
   * @param {string} id
   * @param {Object} updates
   * @param {string} [updates.name]
   * @param {boolean} [updates.archived]
   * @returns {Habit}
   */
  updateHabit(id, { name, archived }) {
    const habit = this.habits.get(id);
    if (!habit) {
      throw new Error(`Habit not found with id: ${id}`);
    }

    if (name !== undefined) {
      const validation = Habit.validateName(name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      habit.name = name.trim();
    }

    if (archived !== undefined) {
      habit.archived = Boolean(archived);
    }

    this.notify();
    return habit;
  }

  /**
   * Toggles or sets archive status for a habit.
   * @param {string} id
   * @param {boolean} [archive=true]
   * @returns {Habit}
   */
  archiveHabit(id, archive = true) {
    return this.updateHabit(id, { archived: archive });
  }

  /**
   * Deletes a habit and its completion history.
   * @param {string} id
   * @returns {boolean}
   */
  deleteHabit(id) {
    const existed = this.habits.delete(id);
    this.completions.delete(id);
    if (existed) {
      this.notify();
    }
    return existed;
  }

  /**
   * Toggles completion for a habit on a specific date.
   * @param {string} habitId
   * @param {string} [date] Defaults to today in local time
   * @returns {boolean} New completion status (true = completed, false = uncompleted)
   */
  toggleCompletion(habitId, date = getLocalDateString()) {
    if (!this.habits.has(habitId)) {
      throw new Error(`Cannot toggle completion: Habit "${habitId}" does not exist.`);
    }

    if (!this.completions.has(habitId)) {
      this.completions.set(habitId, new Set());
    }

    const dateSet = this.completions.get(habitId);
    let newStatus = false;
    if (dateSet.has(date)) {
      dateSet.delete(date);
      newStatus = false;
    } else {
      dateSet.add(date);
      newStatus = true;
    }

    this.notify();
    return newStatus;
  }

  /**
   * Checks if habit is completed for a specific date.
   * @param {string} habitId
   * @param {string} [date]
   * @returns {boolean}
   */
  isCompleted(habitId, date = getLocalDateString()) {
    const dateSet = this.completions.get(habitId);
    return dateSet ? dateSet.has(date) : false;
  }

  /**
   * Retrieves habits matching a filter.
   * @param {'active'|'all'|'archived'} [filter='active']
   * @returns {Habit[]}
   */
  getHabits(filter = 'active') {
    const all = Array.from(this.habits.values());
    if (filter === 'active') {
      return all.filter(h => !h.archived);
    }
    if (filter === 'archived') {
      return all.filter(h => h.archived);
    }
    return all;
  }

  /**
   * Retrieves a single habit by ID.
   * @param {string} id
   * @returns {Habit|undefined}
   */
  getHabit(id) {
    return this.habits.get(id);
  }

  /**
   * Calculates streak stats for a habit.
   * @param {string} habitId
   * @param {string} [referenceDate]
   * @returns {Object}
   */
  getStats(habitId, referenceDate = getLocalDateString()) {
    const dateSet = this.completions.get(habitId) || new Set();
    return calculateStreakStats(dateSet, referenceDate);
  }

  /**
   * Exports raw data representation for CSV serialization.
   * @returns {{ habits: Array<Object>, logs: Array<Object> }}
   */
  exportState() {
    const habits = Array.from(this.habits.values()).map(h => h.toJSON());
    const logs = [];

    for (const [habitId, dateSet] of this.completions.entries()) {
      for (const date of dateSet) {
        logs.push({
          habitId,
          date,
          completed: true
        });
      }
    }

    return { habits, logs };
  }

  /**
   * Replaces current in-memory state with imported data.
   * @param {{ habits: Array<Object>, logs: Array<Object> }} data
   */
  importState(data) {
    this.habits.clear();
    this.completions.clear();

    if (Array.isArray(data.habits)) {
      for (const h of data.habits) {
        try {
          const habit = new Habit(h);
          this.habits.set(habit.id, habit);
          this.completions.set(habit.id, new Set());
        } catch (err) {
          console.warn('Skipping invalid habit during import:', h, err);
        }
      }
    }

    if (Array.isArray(data.logs)) {
      for (const log of data.logs) {
        if (!log.habitId || !log.date) continue;
        // Ensure completion set exists even for orphaned logs
        if (!this.completions.has(log.habitId)) {
          this.completions.set(log.habitId, new Set());
          // Create placeholder habit if missing from habit records
          if (!this.habits.has(log.habitId)) {
            const placeholder = new Habit({
              id: log.habitId,
              name: `Habit (${log.habitId})`,
              createdAt: log.date
            });
            this.habits.set(log.habitId, placeholder);
          }
        }

        const dateSet = this.completions.get(log.habitId);
        if (log.completed !== false) {
          dateSet.add(log.date);
        } else {
          dateSet.delete(log.date);
        }
      }
    }

    this.notify();
  }
}
