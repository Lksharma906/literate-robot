/**
 * CardioLog model representing an aerobic / cardio session.
 */
export class CardioLog {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.activity - e.g. Treadmill, Cycling, Rowing
   * @param {string} options.date - YYYY-MM-DD
   * @param {number} [options.duration=0] - Minutes
   * @param {number} [options.distance=0] - Distance in km/miles
   * @param {number} [options.calories=0] - Estimated calories burned
   * @param {string} [options.notes='']
   */
  constructor({
    id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    activity,
    date,
    duration = 0,
    distance = 0,
    calories = 0,
    notes = ''
  }) {
    if (!activity || !activity.trim()) {
      throw new Error('Cardio activity cannot be empty.');
    }
    if (!date || !date.trim()) {
      throw new Error('Date is required for cardio log.');
    }

    this.id = id;
    this.activity = activity.trim();
    this.date = date.trim();
    this.duration = Math.max(0, parseInt(duration, 10) || 0);
    this.distance = Math.max(0, parseFloat(distance) || 0);
    this.calories = Math.max(0, parseInt(calories, 10) || 0);
    this.notes = (notes || '').trim();
  }

  toJSON() {
    return {
      id: this.id,
      activity: this.activity,
      date: this.date,
      duration: this.duration,
      distance: this.distance,
      calories: this.calories,
      notes: this.notes
    };
  }
}
