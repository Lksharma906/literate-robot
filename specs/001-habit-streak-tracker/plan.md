# Implementation Plan: Habit and Streak Tracker

**Branch**: `001-habit-streak-tracker` | **Date**: 2026-09-28 | **Spec**: [specs/001-habit-streak-tracker/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-habit-streak-tracker/spec.md`

## Summary

Build a lightweight, 100% client-side static web application for tracking daily habits and streaks with zero server dependencies. All user data is persisted in a standardized, RFC 4180-compliant UTF-8 CSV file (`habits.csv`), ensuring complete user data ownership and compatibility with cloud-synced folders (Google Drive, iCloud, Dropbox, OneDrive). The UI provides instant 1-tap check-ins, habit CRUD, streak calculation (current and longest), and a 14/30-day historical visualization grid. The app employs a hybrid storage adapter (File System Access API where supported, universal HTML5 file download/import fallback, and an in-memory/localStorage session backup buffer).

## Technical Context

**Language/Version**: Modern JavaScript (ES2022+ / ES Modules), HTML5, CSS3. Node.js (v18+) for automated tests.

**Primary Dependencies**: None (Zero runtime dependencies; standard browser APIs only).

**Storage**: RFC 4180 UTF-8 CSV file (`habits.csv`) as single source of truth; browser `localStorage` as temporary unexported session backup cache.

**Testing**: Node.js built-in test runner (`node --test`) using native `node:assert/strict`.

**Target Platform**: Modern evergreen desktop and mobile browsers (Chrome, Edge, Safari, Firefox, iOS Safari, Android Chrome).

**Project Type**: Static Web Application (Single-Page App).

**Performance Goals**: Initial load < 1s; habit check-in response < 50ms; streak recalculation < 50ms for 365+ entries; total bundle size < 100KB uncompressed.

**Constraints**: 100% offline-capable, 0 external network requests or telemetry, zero backend/database/auth, human-readable CSV.

**Scale/Scope**: 1–50 active habits per user, thousands of historical daily logs, mobile viewports down to 320px width.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Static & Zero-Backend**: 100% client-side with zero servers, databases, user auth, or external network APIs?
  - *Status*: PASS. Pure static HTML/CSS/JS with no backend.
- [x] **CSV Data Ownership**: All data persisted in simple, human-readable, cloud-folder-compatible CSV?
  - *Status*: PASS. Canonical data stored in row-tagged RFC 4180 CSV (`habits.csv`).
- [x] **Minimal & Mobile-First**: UI is fast, lightweight, and responsive across mobile and desktop?
  - *Status*: PASS. Semantic HTML5, CSS custom properties, touch targets ≥ 48px, zero CSS bloat.
- [x] **Simplicity & Maintainability**: Adheres to YAGNI and standard web tech without unnecessary bloat?
  - *Status*: PASS. Vanilla ES modules, no framework or build bundler required.
- [x] **Reliability & Data Integrity**: Deterministic CSV parsing, edge-case validation, and accurate streak math?
  - *Status*: PASS. Dedicated `csv.js` parser/serializer with malformed row recovery and calendar date streak logic.

## Project Structure

### Documentation (this feature)

```text
specs/001-habit-streak-tracker/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Data model, CSV schema, and state transitions
├── quickstart.md        # Runnable verification and testing guide
├── contracts/           # Storage and service interface contracts
│   ├── csv-storage-contract.md
│   └── service-contract.md
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Implementation tasks (generated via /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── index.html           # Main application entry point & semantic markup
├── css/
│   └── style.css        # Minimal, responsive styles with CSS variables
└── js/
    ├── models/
    │   ├── habit.js      # Habit entity definition & validation
    │   └── completion.js # Daily completion log entity
    ├── storage/
    │   ├── csv.js        # RFC 4180 parser & serializer
    │   └── file-adapter.js # File System Access API & HTML5 fallback
    ├── services/
    │   ├── streak.js     # Current & longest streak math
    │   ├── date-utils.js # Timezone-invariant ISO date calculations
    │   └── habit-service.js # Central state & business logic
    └── ui/
        └── app.js        # DOM binding, event handling, view rendering

tests/
└── unit/
    ├── csv.test.js       # CSV parser/serializer unit tests
    ├── streak.test.js    # Streak calculation algorithms
    └── date-utils.test.js # Calendar and boundary tests
```

**Structure Decision**: Clean separation of concerns into pure domain services and models, an isolated CSV/storage adapter layer, and a minimal UI coordinator. Test files mirror domain services and run directly via native Node.js test runner without tooling overhead.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. All constitutional gates passed cleanly.*
