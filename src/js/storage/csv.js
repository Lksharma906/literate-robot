/**
 * RFC 4180 CSV Parser and Serializer with row-type tagging for Simple Streak & Fitness Tracker.
 * Canonical header: record_type,habit_id,name,date,completed,created_at,archived,set_num,weight,reps,unit,duration,distance,calories,notes
 */

export const CSV_HEADERS = [
  'record_type',
  'habit_id',
  'name',
  'date',
  'completed',
  'created_at',
  'archived',
  'set_num',
  'weight',
  'reps',
  'unit',
  'duration',
  'distance',
  'calories',
  'notes'
];

/**
 * Escapes a field according to RFC 4180 rules.
 * @param {string|number|boolean|null|undefined} val
 * @returns {string}
 */
export function escapeCSVField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Parses a single line or stream of CSV text according to RFC 4180 rules.
 * Handles embedded quotes and commas correctly.
 * @param {string} text
 * @returns {string[][]} Array of row field arrays
 */
export function parseCSVRows(text) {
  if (!text) return [];

  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = cleanText.length;

  while (i < len) {
    const char = cleanText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && cleanText[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < len && cleanText[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push remainder
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses full CSV text into structured domain entities.
 * @param {string} csvContent
 * @returns {{
 *   habits: Array<{ id: string, name: string, createdAt: string, archived: boolean }>,
 *   logs: Array<{ habitId: string, date: string, completed: boolean }>,
 *   gymSets: Array<{ id: string, exercise: string, date: string, setNum: number, weight: number, reps: number, unit: string, notes: string }>,
 *   cardioLogs: Array<{ id: string, activity: string, date: string, duration: number, distance: number, calories: number, notes: string }>,
 *   bodyWeights: Array<{ id: string, date: string, weight: number, unit: string, notes: string }>,
 *   errors: Array<{ rowNumber: number, rawText: string, reason: string }>
 * }}
 */
export function parseCSV(csvContent) {
  const rows = parseCSVRows(csvContent);
  const result = {
    habits: [],
    logs: [],
    gymSets: [],
    cardioLogs: [],
    bodyWeights: [],
    errors: []
  };

  if (rows.length === 0) {
    return result;
  }

  // Identify column indices from header
  const headerRow = rows[0].map(col => col.trim().toLowerCase());
  const colIndex = {
    record_type: headerRow.indexOf('record_type'),
    habit_id: headerRow.indexOf('habit_id') !== -1 ? headerRow.indexOf('habit_id') : headerRow.indexOf('id'),
    name: headerRow.indexOf('name') !== -1 ? headerRow.indexOf('name') : headerRow.indexOf('exercise'),
    date: headerRow.indexOf('date'),
    completed: headerRow.indexOf('completed'),
    created_at: headerRow.indexOf('created_at'),
    archived: headerRow.indexOf('archived'),
    set_num: headerRow.indexOf('set_num'),
    weight: headerRow.indexOf('weight'),
    reps: headerRow.indexOf('reps'),
    unit: headerRow.indexOf('unit'),
    duration: headerRow.indexOf('duration'),
    distance: headerRow.indexOf('distance'),
    calories: headerRow.indexOf('calories'),
    notes: headerRow.indexOf('notes')
  };

  // If header missing record_type or habit_id/id, report error
  if (colIndex.record_type === -1 || colIndex.habit_id === -1) {
    result.errors.push({
      rowNumber: 1,
      rawText: rows[0].join(','),
      reason: 'Missing required header columns (record_type, habit_id).'
    });
    return result;
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNumber = r + 1;

    // Check if entire row is empty
    if (row.every(cell => !cell.trim())) {
      continue;
    }

    const recordType = (row[colIndex.record_type] || '').trim().toLowerCase();
    const habitId = (row[colIndex.habit_id] || '').trim();

    if (!habitId) {
      result.errors.push({
        rowNumber,
        rawText: row.join(','),
        reason: 'Missing required id / habit_id.'
      });
      continue;
    }

    if (recordType === 'habit') {
      const name = colIndex.name !== -1 ? (row[colIndex.name] || '').trim() : '';
      const createdAt = colIndex.created_at !== -1 ? (row[colIndex.created_at] || '').trim() : '';
      const archivedStr = colIndex.archived !== -1 ? (row[colIndex.archived] || '').trim().toLowerCase() : 'false';
      const archived = archivedStr === 'true' || archivedStr === '1';

      if (!name) {
        result.errors.push({
          rowNumber,
          rawText: row.join(','),
          reason: 'Habit record missing name.'
        });
        continue;
      }

      result.habits.push({
        id: habitId,
        name,
        createdAt: createdAt || new Date().toISOString().slice(0, 10),
        archived
      });
    } else if (recordType === 'log') {
      const date = colIndex.date !== -1 ? (row[colIndex.date] || '').trim() : '';
      const completedStr = colIndex.completed !== -1 ? (row[colIndex.completed] || '').trim().toLowerCase() : 'true';
      const completed = completedStr === 'true' || completedStr === '1';

      if (!date) {
        result.errors.push({
          rowNumber,
          rawText: row.join(','),
          reason: 'Log record missing date.'
        });
        continue;
      }

      result.logs.push({
        habitId,
        date,
        completed
      });
    } else if (recordType === 'gym_set') {
      const exercise = (colIndex.name !== -1 ? row[colIndex.name] : (row[2] || '')).trim();
      const date = (colIndex.date !== -1 ? row[colIndex.date] : (row[3] || '')).trim();
      const setNum = parseInt(colIndex.set_num !== -1 ? row[colIndex.set_num] : (row[7] || '1'), 10) || 1;
      const weight = parseFloat(colIndex.weight !== -1 ? row[colIndex.weight] : (row[8] || '0')) || 0;
      const reps = parseInt(colIndex.reps !== -1 ? row[colIndex.reps] : (row[9] || '1'), 10) || 1;
      const unit = (colIndex.unit !== -1 ? row[colIndex.unit] : (row[10] || 'kg')).trim() || 'kg';
      const notes = (colIndex.notes !== -1 ? row[colIndex.notes] : (row[14] || '')).trim();

      if (!exercise || !date) {
        result.errors.push({
          rowNumber,
          rawText: row.join(','),
          reason: 'Gym set missing exercise name or date.'
        });
        continue;
      }

      result.gymSets.push({
        id: habitId,
        exercise,
        date,
        setNum,
        weight,
        reps,
        unit,
        notes
      });
    } else if (recordType === 'cardio') {
      const activity = (colIndex.name !== -1 ? row[colIndex.name] : (row[2] || '')).trim();
      const date = (colIndex.date !== -1 ? row[colIndex.date] : (row[3] || '')).trim();
      const duration = parseInt(colIndex.duration !== -1 ? row[colIndex.duration] : (row[11] || '0'), 10) || 0;
      const distance = parseFloat(colIndex.distance !== -1 ? row[colIndex.distance] : (row[12] || '0')) || 0;
      const calories = parseInt(colIndex.calories !== -1 ? row[colIndex.calories] : (row[13] || '0'), 10) || 0;
      const notes = (colIndex.notes !== -1 ? row[colIndex.notes] : (row[14] || '')).trim();

      if (!activity || !date) {
        result.errors.push({
          rowNumber,
          rawText: row.join(','),
          reason: 'Cardio record missing activity or date.'
        });
        continue;
      }

      result.cardioLogs.push({
        id: habitId,
        activity,
        date,
        duration,
        distance,
        calories,
        notes
      });
    } else if (recordType === 'body_weight') {
      const date = (colIndex.date !== -1 ? row[colIndex.date] : (row[3] || '')).trim();
      const weight = parseFloat(colIndex.weight !== -1 ? row[colIndex.weight] : (row[8] || '0')) || 0;
      const unit = (colIndex.unit !== -1 ? row[colIndex.unit] : (row[10] || 'kg')).trim() || 'kg';
      const notes = (colIndex.notes !== -1 ? row[colIndex.notes] : (row[14] || '')).trim();

      if (!date || weight <= 0) {
        result.errors.push({
          rowNumber,
          rawText: row.join(','),
          reason: 'Body weight record missing date or valid weight.'
        });
        continue;
      }

      result.bodyWeights.push({
        id: habitId,
        date,
        weight,
        unit,
        notes
      });
    } else {
      result.errors.push({
        rowNumber,
        rawText: row.join(','),
        reason: `Unknown record_type "${recordType}".`
      });
    }
  }

  return result;
}

/**
 * Serializes habits, completion logs, and fitness entries into standard RFC 4180 CSV text.
 * @param {{
 *   habits: Array<{ id: string, name: string, createdAt: string, archived: boolean }>,
 *   logs: Array<{ habitId: string, date: string, completed: boolean }>,
 *   gymSets?: Array<Object>,
 *   cardioLogs?: Array<Object>,
 *   bodyWeights?: Array<Object>
 * }} data
 * @returns {string}
 */
export function serializeCSV(data) {
  const lines = [CSV_HEADERS.join(',')];

  // 1. Serialize habits
  if (Array.isArray(data.habits)) {
    const sortedHabits = [...data.habits].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id));
    for (const habit of sortedHabits) {
      const row = [
        'habit',
        escapeCSVField(habit.id),
        escapeCSVField(habit.name),
        '', // date
        '', // completed
        escapeCSVField(habit.createdAt || ''),
        habit.archived ? 'true' : 'false',
        '', '', '', '', '', '', '', ''
      ];
      lines.push(row.join(','));
    }
  }

  // 2. Serialize completion logs
  if (Array.isArray(data.logs)) {
    const sortedLogs = [...data.logs].sort((a, b) => a.date.localeCompare(b.date) || a.habitId.localeCompare(b.habitId));
    for (const log of sortedLogs) {
      const row = [
        'log',
        escapeCSVField(log.habitId),
        '', // name
        escapeCSVField(log.date),
        log.completed ? 'true' : 'false',
        '', // created_at
        '', // archived
        '', '', '', '', '', '', '', ''
      ];
      lines.push(row.join(','));
    }
  }

  // 3. Serialize gym strength sets
  if (Array.isArray(data.gymSets)) {
    const sortedSets = [...data.gymSets].sort((a, b) => a.date.localeCompare(b.date) || a.exercise.localeCompare(b.exercise) || a.setNum - b.setNum);
    for (const set of sortedSets) {
      const row = [
        'gym_set',
        escapeCSVField(set.id),
        escapeCSVField(set.exercise),
        escapeCSVField(set.date),
        '', '', '',
        escapeCSVField(set.setNum),
        escapeCSVField(set.weight),
        escapeCSVField(set.reps),
        escapeCSVField(set.unit || 'kg'),
        '', '', '',
        escapeCSVField(set.notes || '')
      ];
      lines.push(row.join(','));
    }
  }

  // 4. Serialize cardio sessions
  if (Array.isArray(data.cardioLogs)) {
    const sortedCardio = [...data.cardioLogs].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    for (const cardio of sortedCardio) {
      const row = [
        'cardio',
        escapeCSVField(cardio.id),
        escapeCSVField(cardio.activity),
        escapeCSVField(cardio.date),
        '', '', '', '', '', '', '',
        escapeCSVField(cardio.duration),
        escapeCSVField(cardio.distance),
        escapeCSVField(cardio.calories),
        escapeCSVField(cardio.notes || '')
      ];
      lines.push(row.join(','));
    }
  }

  // 5. Serialize body weight logs
  if (Array.isArray(data.bodyWeights)) {
    const sortedWeights = [...data.bodyWeights].sort((a, b) => a.date.localeCompare(b.date));
    for (const bw of sortedWeights) {
      const row = [
        'body_weight',
        escapeCSVField(bw.id),
        '', // name
        escapeCSVField(bw.date),
        '', '', '', '',
        escapeCSVField(bw.weight),
        '',
        escapeCSVField(bw.unit || 'kg'),
        '', '', '',
        escapeCSVField(bw.notes || '')
      ];
      lines.push(row.join(','));
    }
  }

  return lines.join('\r\n') + '\r\n';
}
