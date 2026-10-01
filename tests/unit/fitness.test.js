import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GymSet } from '../../src/js/models/gym-set.js';
import { CardioLog } from '../../src/js/models/cardio-log.js';
import { BodyWeightLog } from '../../src/js/models/body-weight-log.js';
import { FitnessService } from '../../src/js/services/fitness-service.js';
import { parseCSV, serializeCSV } from '../../src/js/storage/csv.js';

describe('Fitness Domain Models and Service (fitness-service.js)', () => {
  const TODAY = '2026-10-01';

  test('GymSet validates inputs and calculates volume accurately', () => {
    assert.throws(() => {
      new GymSet({ exercise: '', date: TODAY });
    }, /Exercise name cannot be empty/);

    const set = new GymSet({
      exercise: 'Bench Press',
      date: TODAY,
      setNum: 1,
      weight: 80,
      reps: 10,
      unit: 'kg'
    });

    assert.strictEqual(set.exercise, 'Bench Press');
    assert.strictEqual(set.weight, 80);
    assert.strictEqual(set.reps, 10);
    assert.strictEqual(set.volume, 800);
  });

  test('CardioLog validates inputs and serializes cleanly', () => {
    assert.throws(() => {
      new CardioLog({ activity: '', date: TODAY });
    }, /Cardio activity cannot be empty/);

    const cardio = new CardioLog({
      activity: 'Treadmill Running',
      date: TODAY,
      duration: 30,
      distance: 5.0,
      calories: 320
    });

    assert.strictEqual(cardio.activity, 'Treadmill Running');
    assert.strictEqual(cardio.duration, 30);
    assert.strictEqual(cardio.distance, 5.0);
    assert.strictEqual(cardio.calories, 320);
  });

  test('BodyWeightLog validates weight must be positive number', () => {
    assert.throws(() => {
      new BodyWeightLog({ date: TODAY, weight: 0 });
    }, /Valid body weight is required/);

    const bw = new BodyWeightLog({
      date: TODAY,
      weight: 75.4,
      unit: 'kg',
      notes: 'Morning fasted'
    });

    assert.strictEqual(bw.weight, 75.4);
    assert.strictEqual(bw.unit, 'kg');
    assert.strictEqual(bw.notes, 'Morning fasted');
  });

  test('FitnessService tracks gym sets, calculates volume, and auto-numbers sets', () => {
    const service = new FitnessService();

    const set1 = service.addGymSet({
      exercise: 'Squat',
      date: TODAY,
      weight: 100,
      reps: 5
    });

    const set2 = service.addGymSet({
      exercise: 'Squat',
      date: TODAY,
      weight: 105,
      reps: 5
    });

    assert.strictEqual(set1.setNum, 1);
    assert.strictEqual(set2.setNum, 2);

    const stats = service.getGymStats(TODAY);
    assert.strictEqual(stats.totalSets, 2);
    assert.strictEqual(stats.totalVolume, 500 + 525); // 1025 kg
    assert.strictEqual(stats.topExercise, 'Squat');
  });

  test('FitnessService aggregates cardio totals and body weight deltas', () => {
    const service = new FitnessService();

    service.addCardioLog({
      activity: 'Stationary Cycling',
      date: TODAY,
      duration: 45,
      distance: 15.5,
      calories: 400
    });

    const cardioStats = service.getCardioStats(TODAY);
    assert.strictEqual(cardioStats.totalDuration, 45);
    assert.strictEqual(cardioStats.totalDistance, 15.5);
    assert.strictEqual(cardioStats.totalCalories, 400);

    // Body weight entries
    service.addBodyWeightLog({ date: '2026-09-25', weight: 76.2 });
    service.addBodyWeightLog({ date: '2026-10-01', weight: 75.4 });

    const bwStats = service.getWeightStats();
    assert.strictEqual(bwStats.latest.weight, 75.4);
    assert.strictEqual(bwStats.changeSincePrev, -0.8);
  });

  test('Unified CSV roundtrips habits and fitness records together with full integrity', () => {
    const fullState = {
      habits: [
        { id: 'h_1', name: 'Drink 2L Water', createdAt: '2026-09-01', archived: false }
      ],
      logs: [
        { habitId: 'h_1', date: '2026-10-01', completed: true }
      ],
      gymSets: [
        { id: 'gs_1', exercise: 'Deadlift', date: '2026-10-01', setNum: 1, weight: 140, reps: 5, unit: 'kg', notes: 'Warmup' },
        { id: 'gs_2', exercise: 'Deadlift', date: '2026-10-01', setNum: 2, weight: 160, reps: 3, unit: 'kg', notes: 'PR' }
      ],
      cardioLogs: [
        { id: 'c_1', activity: 'Rowing', date: '2026-10-01', duration: 20, distance: 4.0, calories: 210, notes: 'Zone 3' }
      ],
      bodyWeights: [
        { id: 'bw_1', date: '2026-10-01', weight: 75.4, unit: 'kg', notes: 'Fasted' }
      ]
    };

    const csvOutput = serializeCSV(fullState);
    const parsed = parseCSV(csvOutput);

    assert.strictEqual(parsed.errors.length, 0);
    assert.strictEqual(parsed.habits.length, 1);
    assert.strictEqual(parsed.logs.length, 1);
    assert.strictEqual(parsed.gymSets.length, 2);
    assert.strictEqual(parsed.cardioLogs.length, 1);
    assert.strictEqual(parsed.bodyWeights.length, 1);

    assert.strictEqual(parsed.gymSets[0].exercise, 'Deadlift');
    assert.strictEqual(parsed.gymSets[0].weight, 140);
    assert.strictEqual(parsed.cardioLogs[0].activity, 'Rowing');
    assert.strictEqual(parsed.bodyWeights[0].weight, 75.4);
  });
});
