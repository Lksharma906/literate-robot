# Contract: Service & Core Operations API

**Feature**: Habit and Streak Tracker  
**Branch**: `001-habit-streak-tracker`  
**Date**: 2026-09-28  

---

## 1. Domain Services Overview

The application logic is decoupled into pure, testable ES modules:
- `StreakService`: Pure functions for streak metrics and history computation.
- `HabitService`: In-memory state manager for habits and logs.
- `StorageAdapter`: File System Access and HTML5 File API handler.

---

## 2. `StreakService` Contract

```javascript
/**
 * Computes current and longest streaks for a given set of completion dates.
 *
 * @param {Set<string>|Array<string>} completedDates - Unique ISO dates ('YYYY-MM-DD')
 * @param {string} [referenceDate] - ISO date for 'today' (defaults to local current day)
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   isCompletedToday: boolean,
 *   history: Array<{ date: string, completed: boolean }>
 * }}
 */
export function calculateStreakStats(completedDates, referenceDate);
```

### Preconditions & Postconditions
- `completedDates`: Any invalid or future date strings are safely excluded.
- `currentStreak`:
  - Returns `0` if neither `referenceDate` nor `referenceDate - 1 day` is in `completedDates`.
  - Increments sequentially backward while consecutive previous days exist.
- `longestStreak`: Returns maximum consecutive sequence found in `completedDates`. Always `longestStreak >= currentStreak`.

---

## 3. `HabitService` Contract

```javascript
export class HabitService {
  constructor(initialData = { habits: [], logs: [] });

  // Habit operations
  createHabit(name);                  // Returns new Habit object
  updateHabit(id, { name, archived }); // Updates fields, returns updated Habit
  deleteHabit(id);                    // Removes habit and associated logs

  // Completion operations
  toggleCompletion(habitId, date);    // Toggles completion state for date, returns boolean
  isCompleted(habitId, date);         // Returns boolean

  // Query operations
  getHabits(filter = 'active');       // Returns Habit[] ('active' | 'all' | 'archived')
  getStats(habitId, referenceDate);   // Returns StreakStats object
  exportState();                      // Returns { habits, logs } for CSV serialization
  importState(parsedData);            // Replaces or merges current state
}
```

---

## 4. `StorageAdapter` Contract

```javascript
export class StorageAdapter {
  // Direct File Access (where window.showOpenFilePicker is supported)
  static isFileSystemAccessSupported(); // Returns boolean
  async openFile();                     // Requests user to pick CSV file, returns text + handle
  async saveFile(handle, csvContent);   // Writes csvContent directly to picked file handle
  async saveFileAs(csvContent);         // Prompts save dialog, returns new handle

  // Universal Fallbacks (Safari, Firefox, Mobile)
  static readUploadedFile(file);        // Reads File object from <input type="file"> as text
  static downloadFile(csvContent, filename = 'habits.csv'); // Triggers browser file download

  // LocalStorage Safety Buffer
  static backupToLocal(data);           // Mirrors JSON/CSV to localStorage
  static loadLocalBackup();             // Retrieves cached state if available
  static clearLocalBackup();            // Clears cache once successfully saved
}
```
