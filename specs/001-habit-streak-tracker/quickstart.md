# Quickstart & Validation Guide: Habit and Streak Tracker

**Feature**: Habit and Streak Tracker  
**Branch**: `001-habit-streak-tracker`  
**Date**: 2026-09-28  

---

## 1. Prerequisites

- A modern web browser (Chrome, Edge, Safari, Firefox).
- Node.js (v18+) for running the automated unit test suite.
- A local static web server (e.g., Python's `python3 -m http.server`, Node's `npx serve`, or opening `src/index.html` directly).

---

## 2. Running Automated Tests

Run the zero-dependency unit tests verifying CSV parsing, serialization, and streak logic:

```bash
# Run unit tests using Node.js built-in test runner
node --test tests/unit/*.test.js
```

**Expected Outcome**:
All tests pass in < 200ms with 0 failures, covering:
- RFC 4180 CSV parsing and edge cases (commas in habit names, empty lines, CRLF linebreaks).
- Streak counting (active today, active yesterday, broken streaks, multi-year longest streaks).
- Timezone and calendar day boundary logic.

---

## 3. Running the Static Web App

Start a local static server from the repository root:

```bash
# Using Python
python3 -m http.server 8080

# Or open in browser
open http://localhost:8080/src/
```

---

## 4. End-to-End Validation Scenarios

### Scenario 1: First-Time User Experience & Creating a Habit
1. Open the application in your browser.
2. Verify the initial state renders a clean, minimal header and an empty-state message: "No habits tracked yet. Create your first habit below."
3. Click **"+ Add Habit"** or use the input field at the bottom.
4. Type `"Drink 2L Water"` and press Enter or click **Add**.
5. **Expected Outcome**:
   - The habit appears in the active daily list.
   - Status indicates incomplete for today (gray check icon or outline).
   - Current Streak shows `0 days`, Longest Streak shows `0 days`.

### Scenario 2: Daily Check-In & Streak Calculation
1. On the `"Drink 2L Water"` habit card, tap the checkmark button.
2. **Expected Outcome**:
   - The card highlights as completed (green checkmark or filled indicator).
   - Current Streak updates immediately to `1 day`.
   - Longest Streak updates to `1 day`.
3. Tap the checkmark button again.
4. **Expected Outcome**:
   - Status toggles back to incomplete.
   - Current Streak returns to `0 days`.

### Scenario 3: History & Multi-Day Streak Verification
1. Tap the habit title or click the **"History"** icon.
2. Verify the 14-day / 30-day mini history grid opens, showing today highlighted with check-in status.
3. Check that the historical grid correctly visualizes completed days vs missed days.

### Scenario 4: CSV Export & Cloud Sync Verification
1. With habits and completions logged, click **"Export CSV"** in the top navigation bar.
2. Open the downloaded `habits.csv` file in a text editor or spreadsheet application (Excel/Google Sheets).
3. Verify the file begins with the header:
   ```csv
   record_type,habit_id,name,date,completed,created_at,archived
   ```
4. Verify both the `habit` row and the `log` rows are formatted cleanly.
5. In a text editor, manually add a new row:
   ```csv
   habit,h_manual,Read 15 Pages,,,2026-09-28,false
   ```
6. In the web app, click **"Import CSV"** and choose the edited file.
7. **Expected Outcome**:
   - The app instantly refreshes with `"Read 15 Pages"` visible in the active habits list alongside existing habits.
   - Zero errors or data loss.

### Scenario 5: Gym Strength Sets, Cardio Sessions, and Body Weight Tracking
1. Switch to the **"🏋️ Gym & Weights"** tab:
   - Tap quick-chips like `"Bench Press"` or type a custom movement.
   - Enter Weight (e.g. `80 kg`) and Reps (e.g. `10`), then tap **"+ Add Set"**.
   - Verify Total Sets increments, Volume Lifted ($\sum \text{weight} \times \text{reps}$) updates, and the set appears in the table.
2. Switch to the **"🏃 Cardio"** tab:
   - Select activity (e.g. `"Treadmill Running"`), Duration (`30 mins`), Distance (`4.5 km`), and Calories (`280 kcal`).
   - Tap **"+ Log Cardio"** and confirm daily duration, distance, and calories aggregate automatically.
3. Switch to the **"⚖️ Body Weight"** tab:
   - Record today's weight (e.g. `75.4 kg`) and note (`"Morning fasted"`).
   - Verify delta vs previous weigh-in is calculated and displayed cleanly.
4. Export CSV:
   - Verify all `habit`, `log`, `gym_set`, `cardio`, and `body_weight` records are exported together in one unified CSV.

