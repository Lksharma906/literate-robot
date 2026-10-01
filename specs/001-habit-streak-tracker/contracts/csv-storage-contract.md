# Contract: CSV Storage Format & File Parser

**Feature**: Habit and Streak Tracker  
**Branch**: `001-habit-streak-tracker`  
**Date**: 2026-09-28  

---

## 1. Storage Interface Overview

This contract governs the serialization format and file interchange protocol between the Simple Streak Tracker client and the underlying CSV file (`habits.csv`).

## 2. File Specifications

- **MIME Type**: `text/csv; charset=utf-8`
- **Line Ending**: Standard `\r\n` (CRLF) or `\n` (LF) tolerated on read; outputs `\r\n` for universal Windows/Mac/Linux compatibility.
- **Delimiter**: Comma (`,`)
- **Quoting**: Fields containing commas, newlines, or quotes MUST be enclosed in double quotes (`"`). Double quotes inside quoted fields are escaped as `""`.
- **Character Encoding**: UTF-8 without BOM (BOM stripped automatically if present upon read).

## 3. Columns & Schema

Header row (must be the first line of the file):
```csv
record_type,habit_id,name,date,completed,created_at,archived
```

### Field Definitions

| Header | Required In | Type | Allowed Values | Example |
| --- | --- | --- | --- | --- |
| `record_type` | All rows | String | `"habit"`, `"log"` | `habit` |
| `habit_id` | All rows | String | Alphanumeric / underscore identifier | `h_1727538900000` |
| `name` | `habit` rows | String | 1–60 UTF-8 characters | `Drink 2L Water` |
| `date` | `log` rows | String | ISO date: `YYYY-MM-DD` | `2026-09-28` |
| `completed` | `log` rows | Boolean string | `"true"`, `"false"` | `true` |
| `created_at` | `habit` rows | String | ISO date: `YYYY-MM-DD` | `2026-09-01` |
| `archived` | `habit` rows | Boolean string | `"true"`, `"false"` | `false` |

## 4. Parser Contract

```typescript
interface ParsedData {
  habits: Array<{
    id: string;
    name: string;
    createdAt: string;
    archived: boolean;
  }>;
  logs: Array<{
    habitId: string;
    date: string;
    completed: boolean;
  }>;
  errors: Array<{
    rowNumber: number;
    rawText: string;
    reason: string;
  }>;
}

function parseCSV(csvContent: string): ParsedData;
function serializeCSV(data: { habits: Habit[]; logs: CompletionLog[] }): string;
```

### Invariant Rules
1. Order of rows within the CSV file does not affect reconstructed state.
2. Blank or whitespace-only lines are ignored.
3. Extra or unknown columns are discarded without failing the parse.
4. Parsing must be non-destructive: parsing and re-serializing identical data yields functionally identical state.
