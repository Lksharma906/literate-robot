---
description: "Task list for Habit and Streak Tracker implementation"
---

# Tasks: Habit and Streak Tracker

**Input**: Design documents from `/specs/001-habit-streak-tracker/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md), [contracts/](contracts/), [research.md](research.md), [quickstart.md](quickstart.md)  

**Tests**: Unit tests are required by the project constitution for core business logic (CSV parsing/serialization, streak calculations, and date utilities) using Node.js built-in test runner.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in descriptions

## Path Conventions

- **Static web app**: `src/` (`index.html`, `css/`, `js/`), `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic directory structure

- [X] T001 Create source and test directory structure per implementation plan in src/ and tests/
- [X] T002 [P] Initialize package.json with test script using Node.js built-in test runner (node --test) in package.json
- [X] T003 [P] Create initial HTML5 application skeleton and metadata in src/index.html

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models, CSV engine, streak math, and shared services that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Implement timezone-safe calendar date helper utilities in src/js/services/date-utils.js
- [X] T005 [P] Create unit tests for date-utils in tests/unit/date-utils.test.js
- [X] T006 [P] Implement RFC 4180 CSV parser and serializer with row-type tagging and error recovery in src/js/storage/csv.js
- [X] T007 [P] Create unit tests for CSV parsing and serialization in tests/unit/csv.test.js
- [X] T008 [P] Implement core Habit and DailyLog data models with validation in src/js/models/habit.js and src/js/models/completion.js
- [X] T009 Implement Streak calculation engine (current streak, longest streak, broken streaks) in src/js/services/streak.js
- [X] T010 Create unit tests for streak calculation algorithms in tests/unit/streak.test.js
- [X] T011 Implement central in-memory state manager HabitService in src/js/services/habit-service.js
- [X] T012 Implement responsive layout and CSS design system with CSS custom properties in src/css/style.css

**Checkpoint**: Core foundation and test harness ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Daily Habit Completion & Tracking (Priority: P1) 🎯 MVP

**Goal**: Allow users to view active habits for today and toggle completion status with a single tap/click, updating streak counters immediately.

**Independent Test**: Open app with loaded habits, toggle today's completion for a habit, verify streak count updates immediately and state persists across reloads.

- [X] T013 [P] [US1] Create unit tests for habit check-in toggle and streak update in tests/unit/habit-service.test.js
- [X] T014 [US1] Implement today's habit list rendering and 1-tap check-in button UI components in src/js/ui/habit-list-view.js
- [X] T015 [US1] Implement check-in click handlers, state mutation, and DOM update coordination in src/js/ui/app.js
- [X] T016 [US1] Add automatic midnight date detection and context refresh timer in src/js/ui/app.js

**Checkpoint**: User Story 1 (MVP) is functional. Users can view today's habits and record daily check-ins with accurate streaks.

---

## Phase 4: User Story 2 - Habit Creation and Management (Priority: P1)

**Goal**: Allow users to create new habits with name validation, edit existing habits, and archive or delete habits.

**Independent Test**: Create a habit "Read 20 Mins", verify it appears in today's active list, attempt to submit an empty name and verify validation rejection, edit/archive the habit and verify removal from active view.

- [X] T017 [P] [US2] Implement habit creation, renaming, and archiving methods in src/js/services/habit-service.js
- [X] T018 [P] [US2] Implement Add Habit modal / inline form with validation feedback in src/js/ui/habit-form-view.js
- [X] T019 [US2] Implement habit management actions (rename, archive, delete confirmation) in src/js/ui/habit-manage-view.js
- [X] T020 [US2] Connect habit creation and management event listeners to HabitService in src/js/ui/app.js

**Checkpoint**: User Stories 1 and 2 are fully integrated. Users can manage their habits and record daily completions.

---

## Phase 5: User Story 3 - Streak Statistics and History Inspection (Priority: P2)

**Goal**: View current streak, all-time longest streak, and a 14/30-day visual completion history grid for each habit.

**Independent Test**: For habits with multi-day completions, open history view and verify accurate current streak, all-time record streak, and chronological 30-day status indicators.

- [X] T021 [P] [US3] Implement 14/30-day historical window generator in src/js/services/streak.js
- [X] T022 [P] [US3] Implement streak summary badges and visual history grid component in src/js/ui/history-view.js
- [X] T023 [US3] Add interactive history inspection modal or expandable details per habit card in src/js/ui/app.js
- [X] T024 [US3] Add styles for completion history heat-grid and streak achievement badges in src/css/style.css

**Checkpoint**: Habit streaks and historical inspection are visual, accurate, and independently testable.

---

## Phase 6: User Story 4 - Transparent CSV Storage, Import, and Export (Priority: P2)

**Goal**: Persist habits and completion logs in human-readable CSV with dual-mode storage adapter (File System Access API with HTML5 file input/download fallback) and localStorage safety buffer.

**Independent Test**: Export data as `habits.csv`, inspect formatting in spreadsheet/text editor, manually add a row, import the file back into the app, and verify seamless state restoration.

- [X] T025 [P] [US4] Implement StorageAdapter supporting File System Access API, file upload reading, and CSV download in src/js/storage/file-adapter.js
- [X] T026 [P] [US4] Implement localStorage safety cache and recovery prompt in src/js/storage/local-cache.js
- [X] T027 [US4] Implement Export CSV, Import CSV, and Open File toolbar buttons and file picker handlers in src/js/ui/storage-toolbar.js
- [X] T028 [US4] Integrate auto-save and dirty-state indicators on habit mutations in src/js/ui/app.js
- [X] T029 [US4] Implement CSV import validation and non-destructive warning modal for corrupted rows in src/js/ui/storage-toolbar.js

**Checkpoint**: Full data sovereignty achieved. Users can sync, backup, and manually edit their CSV files across cloud folders.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, responsive polish, and end-to-end verification

- [X] T030 [P] Conduct responsive layout audit on mobile viewports (320px–768px) and dark/light system theme support in src/css/style.css
- [X] T031 [P] Implement keyboard accessibility (focus outlines, ARIA labels, Enter/Space toggling) across all interactive elements in src/index.html
- [X] T032 Execute full automated test suite via node --test and verify 100% pass rate in tests/unit/
- [X] T033 Validate all end-to-end user scenarios per quickstart.md in specs/001-habit-streak-tracker/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion. (MVP increment)
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion. Integrates with US1.
- **User Story 3 (Phase 5)**: Depends on US1 (requires completion records to visualize streaks).
- **User Story 4 (Phase 6)**: Depends on US1 & US2 (requires habits and logs to serialize/deserialize).
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- **Phase 1 Setup**: T002 and T003 can execute in parallel.
- **Phase 2 Foundational**:
  - `date-utils.js` (T004) and `date-utils.test.js` (T005)
  - `csv.js` (T006) and `csv.test.js` (T007)
  - `models/` (T008) and `style.css` (T012)
  Can all be developed in parallel before unifying into `streak.js` (T009) and `habit-service.js` (T011).
- **User Story Phases**: Once Foundational is complete, US1 and US2 can proceed in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (T001–T003)
2. Complete **Phase 2: Foundational** (T004–T012)
3. Complete **Phase 3: User Story 1** (T013–T016)
4. **STOP and VALIDATE**: Verify daily habit check-in, streak calculation, and UI responsiveness.

### Incremental Delivery

1. Foundation + US1 → Functional check-in MVP.
2. US2 → Habit creation, editing, and archiving.
3. US3 → Streak analytics, history grid, and milestone badges.
4. US4 → CSV file sync, local-first data ownership, and cloud folder compatibility.
5. Polish → Accessibility, theme refinement, and end-to-end validation.
