import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, serializeCSV, escapeCSVField, parseCSVRows } from '../../src/js/storage/csv.js';

describe('CSV Parser and Serializer (csv.js)', () => {
  test('escapeCSVField correctly escapes commas, quotes, and newlines', () => {
    assert.strictEqual(escapeCSVField('Simple Text'), 'Simple Text');
    assert.strictEqual(escapeCSVField('Read, Write, Code'), '"Read, Write, Code"');
    assert.strictEqual(escapeCSVField('He said "Hello"'), '"He said ""Hello"""');
    assert.strictEqual(escapeCSVField('Line 1\nLine 2'), '"Line 1\nLine 2"');
    assert.strictEqual(escapeCSVField(null), '');
    assert.strictEqual(escapeCSVField(undefined), '');
  });

  test('parseCSV correctly parses valid row-tagged CSV', () => {
    const csvContent = [
      'record_type,habit_id,name,date,completed,created_at,archived',
      'habit,h_1,Drink 2L Water,,,2026-09-01,false',
      'habit,h_2,"Meditate, 10 Mins",,,2026-09-10,true',
      'log,h_1,,2026-09-27,true,,',
      'log,h_1,,2026-09-28,true,,',
      'log,h_2,,2026-09-28,false,,'
    ].join('\r\n');

    const result = parseCSV(csvContent);

    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.habits.length, 2);
    assert.strictEqual(result.logs.length, 3);

    assert.deepStrictEqual(result.habits[0], {
      id: 'h_1',
      name: 'Drink 2L Water',
      createdAt: '2026-09-01',
      archived: false
    });

    assert.deepStrictEqual(result.habits[1], {
      id: 'h_2',
      name: 'Meditate, 10 Mins',
      createdAt: '2026-09-10',
      archived: true
    });

    assert.deepStrictEqual(result.logs[0], {
      habitId: 'h_1',
      date: '2026-09-27',
      completed: true
    });

    assert.deepStrictEqual(result.logs[2], {
      habitId: 'h_2',
      date: '2026-09-28',
      completed: false
    });
  });

  test('parseCSV handles malformed lines gracefully without throwing', () => {
    const csvWithErrors = [
      'record_type,habit_id,name,date,completed,created_at,archived',
      'habit,,No ID Habit,,,2026-09-01,false', // missing ID
      'habit,h_valid,Valid Habit,,,2026-09-01,false',
      'log,h_valid,,not_a_date,true,,', // missing/invalid date
      'unknown_type,h_valid,Name,,,,' // unknown type
    ].join('\n');

    const result = parseCSV(csvWithErrors);
    assert.strictEqual(result.habits.length, 1);
    assert.strictEqual(result.habits[0].name, 'Valid Habit');
    assert.ok(result.errors.length >= 2);
  });

  test('parseCSV handles UTF-8 BOM smoothly', () => {
    const bomCsv = '\uFEFFrecord_type,habit_id,name,date,completed,created_at,archived\r\nhabit,h_1,Yoga,,,2026-09-01,false';
    const result = parseCSV(bomCsv);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.habits.length, 1);
    assert.strictEqual(result.habits[0].name, 'Yoga');
  });

  test('serializeCSV roundtrips cleanly through parseCSV', () => {
    const original = {
      habits: [
        { id: 'h_1', name: 'Exercise daily', createdAt: '2026-09-01', archived: false },
        { id: 'h_2', name: 'Read "Sapiens", ch 1', createdAt: '2026-09-15', archived: true }
      ],
      logs: [
        { habitId: 'h_1', date: '2026-09-27', completed: true },
        { habitId: 'h_1', date: '2026-09-28', completed: true }
      ]
    };

    const csvOutput = serializeCSV(original);
    const roundtripped = parseCSV(csvOutput);

    assert.strictEqual(roundtripped.errors.length, 0);
    assert.deepStrictEqual(roundtripped.habits, original.habits);
    assert.deepStrictEqual(roundtripped.logs, original.logs);
  });
});
