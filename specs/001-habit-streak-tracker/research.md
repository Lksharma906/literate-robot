# Technical Research: Habit and Streak Tracker

**Feature**: Habit and Streak Tracker  
**Branch**: `001-habit-streak-tracker`  
**Date**: 2026-09-28  

---

## 1. CSV Data Schema & Storage Architecture

### Context & Challenge
The constitution mandates:
- "Store all user data in a simple CSV file."
- "Compatible with cloud-folder storage and easy to back up or edit manually."
- "No backend, database, login, networking, or AI."

The challenge is representing both **Habit Definitions** (e.g., id, title, creation date, archived status) and **Daily Completion Records** (e.g., date, completion status) within a single CSV file that remains intuitive to view and edit in standard spreadsheet software (Excel, Google Sheets, Numbers) or plain text editors.

### Options Evaluated

1. **Option A: Wide Matrix Format (Habits in rows, dates in columns)**
   - *Format*: `habit_id,habit_name,archived,2026-09-01,2026-09-02,...`
   - *Pros*: Familiar matrix view in spreadsheets.
   - *Cons*: Adding dates requires mutating all rows and headers; horizontal column expansion degrades performance and breaks standard CSV parsing over months/years; high risk of merge conflicts in cloud folders.

2. **Option B: Multi-table / Partitioned CSV (Metadata comments or section dividers)**
   - *Format*:
     ```csv
     # HABITS
     id,name,created_at,archived
     h_1,Drink Water,2026-09-01,false
     # COMPLETIONS
     habit_id,date,completed
     h_1,2026-09-28,true
     ```
   - *Pros*: Clear relational separation.
   - *Cons*: Standard spreadsheet applications do not natively handle multiple tables in a single `.csv` file cleanly; users editing in Excel often strip comment lines upon save.

3. **Option C: Unified Single-Table Row-Tagged CSV (Chosen)**
   - *Format*:
     ```csv
     record_type,habit_id,name,date,completed,created_at,archived
     habit,h_1,Drink 2L Water,,,2026-09-01,false
     habit,h_2,Read 20 Mins,,,2026-09-10,false
     log,h_1,,2026-09-27,true,,
     log,h_1,,2026-09-28,true,,
     log,h_2,,2026-09-28,true,,
     ```
   - *Pros*:
     - 100% compliant with standard RFC 4180 CSV specifications.
     - Single header row; opens smoothly in Excel, Google Sheets, and LibreOffice.
     - Allows users to add a new habit simply by typing `habit,h_3,Morning Jog,,,2026-09-28,false`.
     - Allows logging completion simply by adding `log,h_3,,2026-09-28,true,,`.
     - Trivial to parse and serialize deterministically with zero data loss.

### Decision
Adopt **Option C (Unified Single-Table Row-Tagged CSV)** as the primary canonical schema for `habits.csv`.

---

## 2. File Persistence & Cloud Folder Sync Mechanism

### Context & Challenge
The app is a static client-side web application. It needs to read and write a CSV file located either on the local disk or inside a cloud-synced folder (such as iCloud Drive, Google Drive, OneDrive, or Dropbox) without requiring a backend server.

### Options Evaluated

1. **Option A: File System Access API (`window.showOpenFilePicker` / `showSaveFilePicker`)**
   - *Pros*: Direct two-way binding. The user selects a file once, and subsequent changes can be saved directly back to the exact file on disk without re-prompting downloads.
   - *Cons*: Only supported in Chromium-based desktop browsers (Chrome, Edge, Brave). Not supported in Safari, Firefox, or iOS browsers.

2. **Option B: HTML5 File Input (`<input type="file">`) + Blob Download (`<a download="...">`)**
   - *Pros*: Universal compatibility across 100% of browsers and devices (desktop, mobile, Safari, Firefox).
   - *Cons*: Saving triggers a browser file download rather than direct in-place mutation.

3. **Option C: Hybrid Dual-Mode Adapter + LocalStorage Safety Buffer (Chosen)**
   - Automatically detects if the File System Access API is available.
   - If available: Allows the user to "Open Local CSV" and enables a direct "Save / Auto-Save" mode to that file handle.
   - Universal Fallback: Always provides "Import CSV" and "Export CSV" buttons using standard HTML5 file handling.
   - Safety Cache: Every mutation also mirrors state into browser `localStorage` (`streak_tracker_backup_state`). If the user accidentally closes the tab before saving/exporting, the app detects the unexported buffer and offers to restore or export it.

### Decision
Implement **Option C (Hybrid Dual-Mode Adapter with LocalStorage Safety Cache)**. This guarantees full offline capability and universal device support while delivering desktop cloud-folder ergonomics where supported.

---

## 3. Streak Calculation & Timezone Invariant Algorithm

### Context & Challenge
Users define habits and mark completion across days. Streak tracking must be:
- Accurate when evaluated at any time of day (morning vs night).
- Accurate when crossed over midnight.
- Invariant across timezone changes.

### Streak Logic Specification
All calendar math uses ISO date strings `YYYY-MM-DD` derived from the user's local timezone:

1. **Active Day Detection**:
   - `today` = Local date in `YYYY-MM-DD`.
   - `yesterday` = Local date in `YYYY-MM-DD` minus 1 calendar day.

2. **Current Streak Calculation**:
   - Let `completion_set` be the set of unique `YYYY-MM-DD` dates where the habit was marked `completed = true`.
   - If `today ∈ completion_set`:
     - Consecutive sequence begins at `today`.
     - Count backwards day by day (`today - 1`, `today - 2`, ...) until a missing date is found.
     - `current_streak = count`.
   - Else if `yesterday ∈ completion_set`:
     - Streak is still alive (user has until end of today to complete it).
     - Consecutive sequence begins at `yesterday`.
     - Count backwards day by day (`yesterday - 1`, `yesterday - 2`, ...) until a missing date is found.
     - `current_streak = count`.
   - Else:
     - Neither today nor yesterday was completed.
     - `current_streak = 0`.

3. **Longest Streak Calculation**:
   - Sort all unique completed dates chronologically: `[d_0, d_1, ..., d_n]`.
   - Iterate through sorted dates, computing contiguous day sequences (where `d_{i+1} - d_i == 1 day`).
   - Track `max_streak = max(max_streak, current_run)`.
   - `longest_streak = max_streak`.

### Decision
Standardize on string-based ISO `YYYY-MM-DD` calendar day mathematics. This avoids UTC timestamp drift, daylight savings shifts, and leap-second artifacts.

---

## 4. UI Architecture & Technology Choices

### Context & Constraints
- Constitution rules:
  - "Keep the UI minimal, fast, mobile-friendly, and easy to use."
  - "No backend, database, login, networking, or AI."
  - "Keep the implementation easy to understand and maintain."
  - "Zero heavyweight runtime dependencies."

### Stack Selection
- **Markup**: Clean semantic HTML5 (`<main>`, `<section>`, `<article>`, `<button>`, `<dialog>`).
- **Styling**: Modern CSS3 utilizing CSS variables for themeing (clean typography, high contrast, mobile-friendly touch targets ≥ 48px, zero external CSS dependencies like Tailwind or Bootstrap).
- **Client Logic**: Vanilla ES Modules (`import`/`export`). Cleanly organized into:
  - `models/`: Plain JS data structures.
  - `storage/`: CSV parser, serializer, file handlers.
  - `services/`: Streak math, date utilities.
  - `ui/`: DOM rendering, event delegation.
- **Unit Testing**: Node.js native test runner (`node --test`, available in Node.js 18+). Requires zero `npm install` packages, runs in milliseconds, and validates CSV and streak logic deterministically.

### Decision
Pure standard web stack (HTML5 + CSS3 + Vanilla ES2022 JavaScript) with Node.js built-in test runner for verification.
