import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocalDateString,
  isValidDateString,
  addDays,
  daysBetween,
  getLastNDays,
  formatDateForDisplay
} from '../../src/js/services/date-utils.js';

describe('Date Utilities (date-utils.js)', () => {
  test('getLocalDateString returns valid YYYY-MM-DD format', () => {
    const todayStr = getLocalDateString();
    assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(isValidDateString(todayStr), true);
  });

  test('isValidDateString correctly validates calendar dates', () => {
    assert.strictEqual(isValidDateString('2026-09-28'), true);
    assert.strictEqual(isValidDateString('2024-02-29'), true); // leap year
    assert.strictEqual(isValidDateString('2023-02-29'), false); // non-leap year
    assert.strictEqual(isValidDateString('2026-04-31'), false); // April has 30 days
    assert.strictEqual(isValidDateString('invalid'), false);
    assert.strictEqual(isValidDateString(''), false);
    assert.strictEqual(isValidDateString(null), false);
  });

  test('addDays handles additions, subtractions, and month/year boundaries', () => {
    assert.strictEqual(addDays('2026-09-28', 1), '2026-09-29');
    assert.strictEqual(addDays('2026-09-28', 3), '2026-10-01');
    assert.strictEqual(addDays('2026-09-28', -1), '2026-09-27');
    assert.strictEqual(addDays('2026-01-01', -1), '2025-12-31');
    assert.strictEqual(addDays('2024-02-28', 1), '2024-02-29');
  });

  test('daysBetween correctly calculates day differences', () => {
    assert.strictEqual(daysBetween('2026-09-20', '2026-09-28'), 8);
    assert.strictEqual(daysBetween('2026-09-28', '2026-09-20'), -8);
    assert.strictEqual(daysBetween('2026-09-28', '2026-09-28'), 0);
  });

  test('getLastNDays returns chronological array of N days', () => {
    const days = getLastNDays(5, '2026-09-28');
    assert.deepStrictEqual(days, [
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28'
    ]);
  });

  test('formatDateForDisplay produces readable string', () => {
    const formatted = formatDateForDisplay('2026-09-28');
    assert.ok(formatted.includes('Sep') || formatted.includes('28'));
  });
});
