/**
 * CardioView handles UI interactions for Aerobic and Cardio activities.
 */
export class CardioView {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {Object} options.fitnessService
   * @param {Function} options.onAddCardio - ({ activity, date, duration, distance, calories, notes }) => void
   * @param {Function} options.onDeleteCardio - (id) => void
   */
  constructor({ container, fitnessService, onAddCardio, onDeleteCardio }) {
    this.container = container;
    this.fitnessService = fitnessService;
    this.onAddCardio = onAddCardio;
    this.onDeleteCardio = onDeleteCardio;

    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('submit', (e) => {
      const form = e.target.closest('#cardio-log-form');
      if (!form) return;
      e.preventDefault();

      const activitySelect = form.querySelector('#cardio-activity');
      const durationInput = form.querySelector('#cardio-duration');
      const distanceInput = form.querySelector('#cardio-distance');
      const caloriesInput = form.querySelector('#cardio-calories');
      const notesInput = form.querySelector('#cardio-notes');

      const activity = activitySelect.value.trim();
      const duration = parseInt(durationInput.value, 10) || 0;
      const distance = parseFloat(distanceInput.value) || 0;
      const calories = parseInt(caloriesInput.value, 10) || 0;
      const notes = notesInput ? notesInput.value.trim() : '';

      if (!activity) {
        alert('Please choose a cardio activity.');
        return;
      }
      if (duration <= 0) {
        alert('Please enter a duration in minutes.');
        return;
      }

      this.onAddCardio({
        activity,
        duration,
        distance,
        calories,
        notes
      });
    });

    this.container.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-cardio');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (id) {
          this.onDeleteCardio(id);
        }
      }
    });
  }

  render(dateStr) {
    const stats = this.fitnessService.getCardioStats(dateStr);
    const logs = this.fitnessService.getCardioLogs(dateStr);

    const rowsHtml = logs.length === 0
      ? `<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">No cardio logged for this day. Record your run, cycle, or walk above!</td></tr>`
      : logs
          .map(
            c => `
        <tr class="table-row">
          <td class="font-semibold text-primary">${this.escape(c.activity)}</td>
          <td class="font-mono">${c.duration} mins</td>
          <td class="font-mono">${c.distance > 0 ? c.distance + ' km' : '-'}</td>
          <td class="font-mono text-warning font-semibold">${c.calories > 0 ? c.calories + ' kcal' : '-'}</td>
          <td class="text-muted text-xs">${this.escape(c.notes || '-')}</td>
          <td class="text-right">
            <button type="button" class="btn-icon btn-delete-cardio text-danger" data-id="${c.id}" title="Delete activity">✕</button>
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
            <span class="stat-label">Total Duration</span>
            <span class="stat-val text-primary font-mono">${stats.totalDuration} mins</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Distance Covered</span>
            <span class="stat-val text-accent font-mono">${stats.totalDistance} km</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Calories Burned</span>
            <span class="stat-val text-warning font-mono">${stats.totalCalories} kcal</span>
          </div>
        </div>

        <!-- Form Card -->
        <div class="logger-box">
          <div class="logger-header">
            <h4>🏃 Record Cardio Activity</h4>
            <span class="text-muted text-xs">Track aerobic endurance, duration & energy</span>
          </div>

          <form id="cardio-log-form" class="form-grid">
            <div class="form-group flex-2">
              <label for="cardio-activity">Activity Type</label>
              <select id="cardio-activity" class="input">
                <option value="Treadmill Running">🏃 Treadmill Running</option>
                <option value="Outdoor Running">🏃 Outdoor Running</option>
                <option value="Stationary Cycling">🚴 Stationary Cycling</option>
                <option value="Outdoor Cycling">🚴 Outdoor Cycling</option>
                <option value="Rowing Machine">🚣 Rowing Machine</option>
                <option value="Stairmaster">🪜 Stairmaster</option>
                <option value="Elliptical">⚡ Elliptical</option>
                <option value="Brisk Walking">🚶 Brisk Walking</option>
                <option value="Jump Rope">🪢 Jump Rope</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label for="cardio-duration">Duration (mins)</label>
              <input type="number" id="cardio-duration" class="input font-mono" min="1" max="1440" placeholder="30" required value="30">
            </div>

            <div class="form-group flex-1">
              <label for="cardio-distance">Distance (km)</label>
              <input type="number" id="cardio-distance" class="input font-mono" step="0.1" min="0" placeholder="5.0" value="5.0">
            </div>

            <div class="form-group flex-1">
              <label for="cardio-calories">Calories (kcal)</label>
              <input type="number" id="cardio-calories" class="input font-mono" min="0" placeholder="300" value="300">
            </div>

            <div class="form-group flex-2">
              <label for="cardio-notes">Notes / Pace</label>
              <input type="text" id="cardio-notes" class="input" placeholder="e.g. Zone 2, avg 5:30/km">
            </div>

            <div class="form-group form-action">
              <button type="submit" class="btn btn-primary btn-block">+ Log Cardio</button>
            </div>
          </form>
        </div>

        <!-- Sessions Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Calories</th>
                <th>Notes</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
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
