import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreakStats } from '../../src/js/services/streak.js';

describe('Streak Calculation Engine (streak.js)', () => {
  const REF_DATE = '2026-09-28';

  test('empty history returns 0 streaks', () => {
    const stats = calculateStreakStats([], REF_DATE);
    assert.strictEqual(stats.currentStreak, 0);
    assert.strictEqual(stats.longestStreak, 0);
    assert.strictEqual(stats.isCompletedToday, false);
    assert.strictEqual(stats.totalCompletions, 0);
    assert.strictEqual(stats.rate30d, 0);
    assert.strictEqual(stats.history30d.length, 30);
  });

  test('streak completed today increments current streak', () => {
    // Completed 2026-09-27 and 2026-09-28
    const dates = ['2026-09-27', '2026-09-28'];
    const stats = calculateStreakStats(dates, REF_DATE);

    assert.strictEqual(stats.isCompletedToday, true);
    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.longestStreak, 2);
    assert.strictEqual(stats.totalCompletions, 2);
  });

  test('streak completed yesterday but not today is still active', () => {
    // Completed 2026-09-26 and 2026-09-27, not today
    const dates = ['2026-09-26', '2026-09-27'];
    const stats = calculateStreakStats(dates, REF_DATE);

    assert.strictEqual(stats.isCompletedToday, false);
    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.longestStreak, 2);
  });

  test('missed both today and yesterday resets current streak to 0 while preserving longest streak', () => {
    // Completed 5 consecutive days ending on 2026-09-25 (missed 26 and 27)
    const dates = [
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25'
    ];
    const stats = calculateStreakStats(dates, REF_DATE);

    assert.strictEqual(stats.isCompletedToday, false);
    assert.strictEqual(stats.currentStreak, 0);
    assert.strictEqual(stats.longestStreak, 5);
    assert.strictEqual(stats.totalCompletions, 5);
  });

  test('longest streak correctly identifies maximum consecutive run across historical gaps', () => {
    // 3 days in Aug, 7 days in early Sep, 2 days ending today
    const dates = [
      '2026-08-01', '2026-08-02', '2026-08-03', // 3 days
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', // 7 days
      '2026-09-27', '2026-09-28' // 2 days (current)
    ];
    const stats = calculateStreakStats(dates, REF_DATE);

    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.longestStreak, 7);
    assert.strictEqual(stats.totalCompletions, 12);
  });

  test('future dates are ignored for streak calculation', () => {
    const dates = ['2026-09-28', '2026-09-29', '2026-10-01'];
    const stats = calculateStreakStats(dates, REF_DATE);

    assert.strictEqual(stats.isCompletedToday, true);
    assert.strictEqual(stats.currentStreak, 1);
    assert.strictEqual(stats.totalCompletions, 1);
  });
});
