import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HabitService } from '../../src/js/services/habit-service.js';

describe('HabitService Domain Operations (habit-service.js)', () => {
  const REF_DATE = '2026-09-28';

  test('creates and retrieves active habits', () => {
    const service = new HabitService();
    const habit = service.createHabit('Exercise 30 mins');

    assert.ok(habit.id);
    assert.strictEqual(habit.name, 'Exercise 30 mins');
    assert.strictEqual(habit.archived, false);

    const activeHabits = service.getHabits('active');
    assert.strictEqual(activeHabits.length, 1);
    assert.strictEqual(activeHabits[0].id, habit.id);
  });

  test('toggleCompletion toggles daily status and calculates streaks accurately', () => {
    const service = new HabitService();
    const habit = service.createHabit('Drink Water');

    // Initially incomplete
    assert.strictEqual(service.isCompleted(habit.id, REF_DATE), false);
    let stats = service.getStats(habit.id, REF_DATE);
    assert.strictEqual(stats.currentStreak, 0);

    // Toggle complete for today
    const status1 = service.toggleCompletion(habit.id, REF_DATE);
    assert.strictEqual(status1, true);
    assert.strictEqual(service.isCompleted(habit.id, REF_DATE), true);

    stats = service.getStats(habit.id, REF_DATE);
    assert.strictEqual(stats.currentStreak, 1);
    assert.strictEqual(stats.longestStreak, 1);

    // Toggle uncomplete for today
    const status2 = service.toggleCompletion(habit.id, REF_DATE);
    assert.strictEqual(status2, false);
    assert.strictEqual(service.isCompleted(habit.id, REF_DATE), false);

    stats = service.getStats(habit.id, REF_DATE);
    assert.strictEqual(stats.currentStreak, 0);
  });

  test('consecutive days completion builds current and longest streak', () => {
    const service = new HabitService();
    const habit = service.createHabit('Read Book');

    // Complete yesterday and today
    service.toggleCompletion(habit.id, '2026-09-27');
    service.toggleCompletion(habit.id, '2026-09-28');

    const stats = service.getStats(habit.id, '2026-09-28');
    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.longestStreak, 2);
  });

  test('updating and archiving habits updates visibility', () => {
    const service = new HabitService();
    const habit = service.createHabit('Meditate');

    service.updateHabit(habit.id, { name: 'Mindfulness Meditation', archived: true });

    assert.strictEqual(service.getHabits('active').length, 0);
    assert.strictEqual(service.getHabits('archived').length, 1);
    assert.strictEqual(service.getHabits('archived')[0].name, 'Mindfulness Meditation');
  });

  test('deleteHabit removes habit and all associated completion logs', () => {
    const service = new HabitService();
    const habit = service.createHabit('Temporary Habit');
    service.toggleCompletion(habit.id, REF_DATE);

    assert.strictEqual(service.getHabits('all').length, 1);
    const deleted = service.deleteHabit(habit.id);
    assert.strictEqual(deleted, true);
    assert.strictEqual(service.getHabits('all').length, 0);
    assert.strictEqual(service.isCompleted(habit.id, REF_DATE), false);
  });

  test('exportState and importState preserve full data integrity', () => {
    const service1 = new HabitService();
    const h1 = service1.createHabit('Yoga');
    service1.toggleCompletion(h1.id, '2026-09-27');
    service1.toggleCompletion(h1.id, '2026-09-28');

    const exported = service1.exportState();

    const service2 = new HabitService();
    service2.importState(exported);

    assert.strictEqual(service2.getHabits('all').length, 1);
    assert.strictEqual(service2.getHabit(h1.id).name, 'Yoga');
    const stats = service2.getStats(h1.id, '2026-09-28');
    assert.strictEqual(stats.currentStreak, 2);
  });
});
