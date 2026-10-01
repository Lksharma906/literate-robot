<!--
Sync Impact Report:
- Version change: 0.0.0 (template) → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Static & Zero-Backend Architecture
  - [PRINCIPLE_2_NAME] → II. File-Based Data Ownership (CSV Storage)
  - [PRINCIPLE_3_NAME] → III. Minimalist, Fast, and Mobile-Friendly UX
  - [PRINCIPLE_4_NAME] → IV. Simplicity, Maintainability, and Lean Implementation
  - [PRINCIPLE_5_NAME] → V. Reliability and Data Integrity
- Added sections:
  - Data Model & Storage Constraints
  - Development & Quality Standards
- Removed sections:
  - None (all placeholders replaced)
- Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ updated (aligned Constitution Check gates & static web project layout)
  - .specify/templates/tasks-template.md: ✅ updated (aligned foundational phase examples with client-side & CSV storage)
  - .specify/templates/spec-template.md: ✅ verified (generic requirements template aligned)
- Follow-up TODOs:
  - None (all template slots defined)
-->

# Simple Streak Tracker Constitution

## Core Principles

### I. Static & Zero-Backend Architecture
The application MUST be a 100% client-side static web application with zero server-side backends, databases, user authentication, or network APIs. All processing, habit streak calculations, and UI rendering MUST execute entirely within the user's browser environment. The application MUST function completely offline once loaded.
*Rationale: Eliminates operational hosting costs, server maintenance, privacy vulnerabilities, network latency, and external points of failure.*

### II. File-Based Data Ownership (CSV Storage)
All user data MUST be persisted in a simple, human-readable CSV format. Data persistence MUST support direct local file access or import/export workflows compatible with cloud sync folders (e.g., Google Drive, iCloud, Dropbox, OneDrive). Users MUST be able to inspect, back up, and edit their tracking data directly using standard text or spreadsheet editors without proprietary lock-in.
*Rationale: Guarantees user sovereignty over personal habits, ensures maximum data durability, and enables seamless backups without third-party dependence.*

### III. Minimalist, Fast, and Mobile-Friendly UX
The user interface MUST be lightweight, responsive, and optimized for both mobile and desktop screens. Habit tracking workflows (e.g., marking daily completion, reviewing current/longest streaks) MUST require minimal taps/clicks and zero cognitive overhead. Load times MUST be near-instantaneous with no bloat, heavy animations, or distracting UI clutter.
*Rationale: Habit adherence relies on low friction; any delay, unnecessary navigation, or UI complexity discourages daily user engagement.*

### IV. Simplicity, Maintainability, and Lean Implementation
The codebase MUST prioritize clarity, small footprint, and maintainability over clever abstractions or heavy frameworks. Code SHOULD adhere to modern web standards (HTML5, CSS3, vanilla JavaScript or minimal modern tooling) and remain easy for any developer to audit, understand, and modify. The YAGNI principle is strictly enforced: advanced features (gamification, social sharing, push notifications, AI) MUST NOT be added.
*Rationale: A lean, standard-compliant implementation ensures longevity, debuggability, and effortless maintenance.*

### V. Reliability and Data Integrity
Data mutations and file input/output MUST be deterministic and resilient against data corruption. The application MUST gracefully validate CSV structure upon loading, handle malformed or manually edited rows non-destructively, and calculate streaks accurately according to standard calendar dates and the user's local timezone.
*Rationale: Habit tracking requires high trust; inaccurate streaks or lost history destroy user motivation.*

## Data Model & Storage Constraints

1. **Storage Format**: Data MUST be stored in valid RFC 4180-compliant UTF-8 CSV files with explicit header definitions.
2. **Schema Simplicity**: The CSV structure MUST remain straightforward and human-readable, representing habit definitions, daily completion logs, and streak metadata without convoluted serialization.
3. **Manual Editing Resiliency**: The parser MUST tolerate manual edits, extra whitespace, or harmless formatting differences, emitting clear warnings rather than silent data corruption or application crashes.
4. **No Remote Telemetry**: The application MUST NOT make network calls, send telemetry, track analytics, or interact with external third-party services. User data MUST never leave the user's local system.

## Development & Quality Standards

1. **Test-First Logic Verification**: Core business logic—including CSV parsing/serialization, streak algorithms (current streak, longest streak, broken streaks), and date/timezone calculations—MUST be verified by automated unit tests.
2. **Device & Viewport Responsiveness**: All views MUST render cleanly and operate reliably across viewport widths ranging from mobile (320px+) to wide desktop monitors.
3. **Zero Runtime Dependencies**: The client application MUST NOT introduce heavyweight runtime frameworks or vendor libraries when native browser capabilities suffice.
4. **Accessible & Semantics-First UI**: UI elements MUST use semantic HTML elements and accessible design patterns for keyboard navigation and screen readers.

## Governance

1. **Supremacy**: This Constitution is the authoritative governing document for Simple Streak Tracker. All implementation plans, specifications, and pull requests MUST comply with the principles and constraints established herein.
2. **Amendment Procedure**: Amendments to this Constitution require explicit documentation of rationale, a migration plan for existing data/code, and a corresponding semantic version bump.
3. **Semantic Versioning**:
   - **MAJOR (X.0.0)**: Breaking changes to foundational principles (e.g., adding external network calls, switching away from CSV storage, introducing backend services).
   - **MINOR (1.X.0)**: Addition of new principles, structural constraints, or materially expanded governance rules.
   - **PATCH (1.0.X)**: Non-breaking clarifications, wording refinements, and typo fixes.
4. **Compliance Gate**: Every feature specification and implementation plan MUST complete the Constitution Check gate before commencing implementation. Any complexity or divergence MUST be explicitly justified and tracked.

**Version**: 1.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-09-28
