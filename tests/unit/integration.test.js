import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HabitService } from '../../src/js/services/habit-service.js';
import { parseCSV, serializeCSV } from '../../src/js/storage/csv.js';

describe('End-to-End User Scenarios (quickstart.md validation)', () => {
  const TODAY = '2026-09-28';
  const YESTERDAY = '2026-09-27';
  const TWO_DAYS_AGO = '2026-09-26';

  test('Scenario 1: First-Time User creates habit with validation', () => {
    const service = new HabitService();

    // Verify empty name is rejected
    assert.throws(() => {
      service.createHabit('   ');
    }, /Habit name cannot be empty/);

    // Create valid habit
    const habit = service.createHabit('Drink 2L Water');
    assert.ok(habit.id);
    assert.strictEqual(habit.name, 'Drink 2L Water');
    assert.strictEqual(service.getHabits('active').length, 1);

    const stats = service.getStats(habit.id, TODAY);
    assert.strictEqual(stats.currentStreak, 0);
    assert.strictEqual(stats.longestStreak, 0);
  });

  test('Scenario 2: Daily Check-In & Streak Calculation', () => {
    const service = new HabitService();
    const habit = service.createHabit('Drink 2L Water');

    // 1-tap check-in for today
    const checked = service.toggleCompletion(habit.id, TODAY);
    assert.strictEqual(checked, true);

    let stats = service.getStats(habit.id, TODAY);
    assert.strictEqual(stats.isCompletedToday, true);
    assert.strictEqual(stats.currentStreak, 1);
    assert.strictEqual(stats.longestStreak, 1);

    // 1-tap uncheck
    const unchecked = service.toggleCompletion(habit.id, TODAY);
    assert.strictEqual(unchecked, false);

    stats = service.getStats(habit.id, TODAY);
    assert.strictEqual(stats.isCompletedToday, false);
    assert.strictEqual(stats.currentStreak, 0);
  });

  test('Scenario 3: History & Multi-Day Streak Verification', () => {
    const service = new HabitService();
    const habit = service.createHabit('Morning Run');

    // Complete two days ago, yesterday, and today
    service.toggleCompletion(habit.id, TWO_DAYS_AGO);
    service.toggleCompletion(habit.id, YESTERDAY);
    service.toggleCompletion(habit.id, TODAY);

    const stats = service.getStats(habit.id, TODAY);
    assert.strictEqual(stats.currentStreak, 3);
    assert.strictEqual(stats.longestStreak, 3);
    assert.strictEqual(stats.totalCompletions, 3);
    assert.strictEqual(stats.history30d.length, 30);

    const todayCell = stats.history30d.find(d => d.date === TODAY);
    assert.strictEqual(todayCell.completed, true);
  });

  test('Scenario 4: CSV Export, Manual Editing, and Import Verification', () => {
    const service = new HabitService();
    const h1 = service.createHabit('Drink 2L Water');
    service.toggleCompletion(h1.id, YESTERDAY);
    service.toggleCompletion(h1.id, TODAY);

    // Export to CSV
    const csvExport = serializeCSV(service.exportState());
    assert.ok(csvExport.includes('record_type,habit_id,name,date,completed,created_at,archived'));
    assert.ok(csvExport.includes('Drink 2L Water'));
    assert.ok(csvExport.includes(TODAY));

    // Simulate manual editing in text editor: add a new habit
    const manuallyEditedCSV = csvExport + 'habit,h_manual,Read 15 Pages,,,2026-09-28,false\r\n';

    // Import into fresh service
    const parsed = parseCSV(manuallyEditedCSV);
    assert.strictEqual(parsed.errors.length, 0);

    const importedService = new HabitService();
    importedService.importState({
      habits: parsed.habits,
      logs: parsed.logs
    });

    // Verify both original habit and manually added habit exist with full state
    const allHabits = importedService.getHabits('all');
    assert.strictEqual(allHabits.length, 2);

    const manualHabit = allHabits.find(h => h.name === 'Read 15 Pages');
    assert.ok(manualHabit);
    assert.strictEqual(manualHabit.id, 'h_manual');

    const originalStats = importedService.getStats(h1.id, TODAY);
    assert.strictEqual(originalStats.currentStreak, 2);
    assert.strictEqual(originalStats.longestStreak, 2);
  });
});
