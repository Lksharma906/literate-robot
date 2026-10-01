/**
 * GymSet model representing a single strength training set.
 */
export class GymSet {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.exercise
   * @param {string} options.date - YYYY-MM-DD
   * @param {number} [options.setNum=1]
   * @param {number} [options.weight=0]
   * @param {number} [options.reps=1]
   * @param {string} [options.unit='kg']
   * @param {string} [options.notes='']
   */
  constructor({
    id = `gs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    exercise,
    date,
    setNum = 1,
    weight = 0,
    reps = 1,
    unit = 'kg',
    notes = ''
  }) {
    if (!exercise || !exercise.trim()) {
      throw new Error('Exercise name cannot be empty.');
    }
    if (!date || !date.trim()) {
      throw new Error('Date is required for gym set.');
    }

    this.id = id;
    this.exercise = exercise.trim();
    this.date = date.trim();
    this.setNum = Math.max(1, parseInt(setNum, 10) || 1);
    this.weight = Math.max(0, parseFloat(weight) || 0);
    this.reps = Math.max(1, parseInt(reps, 10) || 1);
    this.unit = unit === 'lbs' ? 'lbs' : 'kg';
    this.notes = (notes || '').trim();
  }

  /**
   * Total volume lifted in this set (weight * reps).
   * @returns {number}
   */
  get volume() {
    return this.weight * this.reps;
  }

  toJSON() {
    return {
      id: this.id,
      exercise: this.exercise,
      date: this.date,
      setNum: this.setNum,
      weight: this.weight,
      reps: this.reps,
      unit: this.unit,
      notes: this.notes
    };
  }
}
