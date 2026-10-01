import { GymSet } from '../models/gym-set.js';
import { CardioLog } from '../models/cardio-log.js';
import { BodyWeightLog } from '../models/body-weight-log.js';

/**
 * FitnessService coordinates gym strength sets, cardio sessions, and body weight logs.
 */
export class FitnessService {
  /**
   * @param {Object} [initialData]
   * @param {Array<Object>} [initialData.gymSets]
   * @param {Array<Object>} [initialData.cardioLogs]
   * @param {Array<Object>} [initialData.bodyWeights]
   */
  constructor(initialData = { gymSets: [], cardioLogs: [], bodyWeights: [] }) {
    this.gymSets = new Map(); // id -> GymSet
    this.cardioLogs = new Map(); // id -> CardioLog
    this.bodyWeights = new Map(); // id -> BodyWeightLog
    this.listeners = new Set();

    if (initialData) {
      this.importState(initialData);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in FitnessService listener:', err);
      }
    }
  }

  /* =========================================================================
     GYM & STRENGTH TRAINING
     ========================================================================= */

  /**
   * Logs a gym exercise set.
   * Auto-calculates set number for that exercise on that date if not explicitly passed.
   */
  addGymSet({ id, exercise, date, setNum, weight, reps, unit = 'kg', notes = '' }) {
    let resolvedSetNum = setNum;
    if (!resolvedSetNum) {
      const existingSets = this.getGymSets(date).filter(
        s => s.exercise.toLowerCase() === exercise.trim().toLowerCase()
      );
      resolvedSetNum = existingSets.length + 1;
    }

    const set = new GymSet({
      id,
      exercise,
      date,
      setNum: resolvedSetNum,
      weight,
      reps,
      unit,
      notes
    });

    this.gymSets.set(set.id, set);
    this.notify();
    return set;
  }

  deleteGymSet(id) {
    const deleted = this.gymSets.delete(id);
    if (deleted) {
      this.notify();
    }
    return deleted;
  }

  getGymSets(date) {
    const sets = Array.from(this.gymSets.values());
    const filtered = date ? sets.filter(s => s.date === date) : sets;
    return filtered.sort((a, b) => {
      const exCompare = a.exercise.localeCompare(b.exercise);
      if (exCompare !== 0) return exCompare;
      return a.setNum - b.setNum;
    });
  }

  getAllGymSets() {
    return Array.from(this.gymSets.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  getRecentExercises(limit = 10) {
    const counts = new Map();
    for (const set of this.gymSets.values()) {
      counts.set(set.exercise, (counts.get(set.exercise) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, limit);
  }

  getGymStats(date) {
    const sets = this.getGymSets(date);
    let totalVolume = 0;
    const exerciseMap = new Map();

    for (const set of sets) {
      totalVolume += set.volume;
      exerciseMap.set(set.exercise, (exerciseMap.get(set.exercise) || 0) + 1);
    }

    let topExercise = '-';
    let maxSets = 0;
    for (const [ex, count] of exerciseMap.entries()) {
      if (count > maxSets) {
        maxSets = count;
        topExercise = ex;
      }
    }

    return {
      totalSets: sets.length,
      totalVolume,
      topExercise,
      exerciseCount: exerciseMap.size
    };
  }

  /* =========================================================================
     CARDIO SESSIONS
     ========================================================================= */

  addCardioLog({ id, activity, date, duration, distance, calories, notes = '' }) {
    const log = new CardioLog({
      id,
      activity,
      date,
      duration,
      distance,
      calories,
      notes
    });

    this.cardioLogs.set(log.id, log);
    this.notify();
    return log;
  }

  deleteCardioLog(id) {
    const deleted = this.cardioLogs.delete(id);
    if (deleted) {
      this.notify();
    }
    return deleted;
  }

  getCardioLogs(date) {
    const logs = Array.from(this.cardioLogs.values());
    const filtered = date ? logs.filter(l => l.date === date) : logs;
    return filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  getCardioStats(date) {
    const logs = this.getCardioLogs(date);
    let totalDuration = 0;
    let totalDistance = 0;
    let totalCalories = 0;

    for (const log of logs) {
      totalDuration += log.duration;
      totalDistance += log.distance;
      totalCalories += log.calories;
    }

    return {
      count: logs.length,
      totalDuration,
      totalDistance: +totalDistance.toFixed(2),
      totalCalories
    };
  }

  /* =========================================================================
     BODY WEIGHT TRACKING
     ========================================================================= */

  addBodyWeightLog({ id, date, weight, unit = 'kg', notes = '' }) {
    const log = new BodyWeightLog({
      id,
      date,
      weight,
      unit,
      notes
    });

    this.bodyWeights.set(log.id, log);
    this.notify();
    return log;
  }

  deleteBodyWeightLog(id) {
    const deleted = this.bodyWeights.delete(id);
    if (deleted) {
      this.notify();
    }
    return deleted;
  }

  getBodyWeightLogs() {
    return Array.from(this.bodyWeights.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  getLatestWeight() {
    const sorted = this.getBodyWeightLogs();
    return sorted.length > 0 ? sorted[0] : null;
  }

  getWeightStats() {
    const logs = this.getBodyWeightLogs();
    if (logs.length === 0) {
      return { latest: null, change7d: 0, min: 0, max: 0 };
    }

    const latest = logs[0];
    const prev = logs.length > 1 ? logs[1] : latest;
    const oldest = logs[logs.length - 1];
    const weights = logs.map(l => l.weight);

    return {
      latest,
      changeSincePrev: +(latest.weight - prev.weight).toFixed(2),
      changeTotal: +(latest.weight - oldest.weight).toFixed(2),
      min: Math.min(...weights),
      max: Math.max(...weights)
    };
  }

  /* =========================================================================
     IMPORT / EXPORT STATE
     ========================================================================= */

  exportState() {
    return {
      gymSets: Array.from(this.gymSets.values()).map(s => s.toJSON()),
      cardioLogs: Array.from(this.cardioLogs.values()).map(c => c.toJSON()),
      bodyWeights: Array.from(this.bodyWeights.values()).map(w => w.toJSON())
    };
  }

  importState(data = {}) {
    this.gymSets.clear();
    this.cardioLogs.clear();
    this.bodyWeights.clear();

    if (Array.isArray(data.gymSets)) {
      for (const item of data.gymSets) {
        try {
          const s = new GymSet(item);
          this.gymSets.set(s.id, s);
        } catch (err) {
          console.warn('Skipping invalid gym set:', item, err);
        }
      }
    }

    if (Array.isArray(data.cardioLogs)) {
      for (const item of data.cardioLogs) {
        try {
          const c = new CardioLog(item);
          this.cardioLogs.set(c.id, c);
        } catch (err) {
          console.warn('Skipping invalid cardio log:', item, err);
        }
      }
    }

    if (Array.isArray(data.bodyWeights)) {
      for (const item of data.bodyWeights) {
        try {
          const w = new BodyWeightLog(item);
          this.bodyWeights.set(w.id, w);
        } catch (err) {
          console.warn('Skipping invalid body weight log:', item, err);
        }
      }
    }

    this.notify();
  }

  clear() {
    this.gymSets.clear();
    this.cardioLogs.clear();
    this.bodyWeights.clear();
    this.notify();
  }
}
