/**
 * GymView handles UI interactions for Strength / Weight Training sets.
 */
export class GymView {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {Object} options.fitnessService
   * @param {Function} options.onAddSet - ({ exercise, date, weight, reps, unit, notes }) => void
   * @param {Function} options.onDeleteSet - (id) => void
   */
  constructor({ container, fitnessService, onAddSet, onDeleteSet }) {
    this.container = container;
    this.fitnessService = fitnessService;
    this.onAddSet = onAddSet;
    this.onDeleteSet = onDeleteSet;

    this.commonExercises = [
      'Bench Press',
      'Barbell Squat',
      'Deadlift',
      'Overhead Press',
      'Incline DB Press',
      'Bicep Curls',
      'Lat Pulldown',
      'Tricep Pushdown',
      'Dumbbell Row'
    ];

    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('submit', (e) => {
      const form = e.target.closest('#gym-set-form');
      if (!form) return;
      e.preventDefault();

      const exerciseInput = form.querySelector('#gym-exercise-name');
      const weightInput = form.querySelector('#gym-set-weight');
      const repsInput = form.querySelector('#gym-set-reps');
      const unitSelect = form.querySelector('#gym-set-unit');
      const notesInput = form.querySelector('#gym-set-notes');

      const exercise = exerciseInput.value.trim();
      const weight = parseFloat(weightInput.value) || 0;
      const reps = parseInt(repsInput.value, 10) || 1;
      const unit = unitSelect ? unitSelect.value : 'kg';
      const notes = notesInput ? notesInput.value.trim() : '';

      if (!exercise) {
        alert('Please enter an exercise name.');
        return;
      }

      this.onAddSet({
        exercise,
        weight,
        reps,
        unit,
        notes
      });

      // Keep exercise for fast multi-set logging, focus reps or weight
      repsInput.focus();
    });

    this.container.addEventListener('click', (e) => {
      // Quick exercise chip click
      const chip = e.target.closest('.exercise-chip');
      if (chip) {
        const name = chip.dataset.exercise;
        const input = this.container.querySelector('#gym-exercise-name');
        if (input) {
          input.value = name;
          input.focus();
        }
        return;
      }

      // Delete set button click
      const deleteBtn = e.target.closest('.btn-delete-set');
      if (deleteBtn) {
        const setId = deleteBtn.dataset.id;
        if (setId) {
          this.onDeleteSet(setId);
        }
      }
    });
  }

  render(dateStr) {
    const stats = this.fitnessService.getGymStats(dateStr);
    const sets = this.fitnessService.getGymSets(dateStr);

    const chipsHtml = this.commonExercises
      .map(
        ex => `<button type="button" class="btn-chip exercise-chip" data-exercise="${ex}">${ex}</button>`
      )
      .join('');

    const setsRowsHtml = sets.length === 0
      ? `<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">No gym sets logged for this day. Log your first set above!</td></tr>`
      : sets
          .map(
            s => `
        <tr class="table-row">
          <td class="font-semibold text-primary">${this.escape(s.exercise)}</td>
          <td><span class="badge badge-neutral">Set ${s.setNum}</span></td>
          <td class="font-mono">${s.weight} ${s.unit}</td>
          <td class="font-mono">${s.reps} reps</td>
          <td class="font-mono font-bold text-accent">${s.volume.toLocaleString()} ${s.unit}</td>
          <td class="text-right">
            <button type="button" class="btn-icon btn-delete-set text-danger" data-id="${s.id}" title="Delete set">✕</button>
          </td>
        </tr>
      `
          )
          .join('');

    this.container.innerHTML = `
      <div class="fitness-card">
        <!-- Quick Stats Banner -->
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-label">Total Sets</span>
            <span class="stat-val text-primary">${stats.totalSets}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Volume Lifted</span>
            <span class="stat-val text-accent">${stats.totalVolume.toLocaleString()} kg</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Top Exercise</span>
            <span class="stat-val text-secondary truncate">${this.escape(stats.topExercise)}</span>
          </div>
        </div>

        <!-- Form Card -->
        <div class="logger-box">
          <div class="logger-header">
            <h4>🏋️ Log Exercise Set</h4>
            <span class="text-muted text-xs">Tap a movement below to quick-fill</span>
          </div>

          <div class="chips-container">
            ${chipsHtml}
          </div>

          <form id="gym-set-form" class="form-grid">
            <div class="form-group flex-2">
              <label for="gym-exercise-name">Exercise</label>
              <input type="text" id="gym-exercise-name" class="input" placeholder="e.g. Bench Press" required list="recent-exercises-list">
              <datalist id="recent-exercises-list">
                ${this.fitnessService.getRecentExercises().map(e => `<option value="${this.escape(e)}">`).join('')}
              </datalist>
            </div>

            <div class="form-group flex-1">
              <label for="gym-set-weight">Weight</label>
              <div class="input-with-select">
                <input type="number" id="gym-set-weight" class="input font-mono" step="0.5" min="0" placeholder="60" required value="60">
                <select id="gym-set-unit" class="select-inline">
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div class="form-group flex-1">
              <label for="gym-set-reps">Reps</label>
              <input type="number" id="gym-set-reps" class="input font-mono" min="1" max="500" placeholder="10" required value="10">
            </div>

            <div class="form-group flex-1">
              <label for="gym-set-notes">Notes / RPE</label>
              <input type="text" id="gym-set-notes" class="input" placeholder="e.g. RPE 8, drop set">
            </div>

            <div class="form-group form-action">
              <button type="submit" class="btn btn-primary btn-block">+ Add Set</button>
            </div>
          </form>
        </div>

        <!-- Sets Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Set</th>
                <th>Weight</th>
                <th>Reps</th>
                <th>Volume</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${setsRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
