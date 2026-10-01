/**
 * BodyWeightLog model representing a daily body weight check-in.
 */
export class BodyWeightLog {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.date - YYYY-MM-DD
   * @param {number} options.weight - e.g. 75.4
   * @param {string} [options.unit='kg']
   * @param {string} [options.notes='']
   */
  constructor({
    id = `bw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date,
    weight,
    unit = 'kg',
    notes = ''
  }) {
    if (!date || !date.trim()) {
      throw new Error('Date is required for body weight log.');
    }
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      throw new Error('Valid body weight is required (must be greater than 0).');
    }

    this.id = id;
    this.date = date.trim();
    this.weight = parsedWeight;
    this.unit = unit === 'lbs' ? 'lbs' : 'kg';
    this.notes = (notes || '').trim();
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      weight: this.weight,
      unit: this.unit,
      notes: this.notes
    };
  }
}
