/**
 * BodyWeightView handles UI interactions for tracking daily body weight.
 */
export class BodyWeightView {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {Object} options.fitnessService
   * @param {Function} options.onAddWeight - ({ date, weight, unit, notes }) => void
   * @param {Function} options.onDeleteWeight - (id) => void
   */
  constructor({ container, fitnessService, onAddWeight, onDeleteWeight }) {
    this.container = container;
    this.fitnessService = fitnessService;
    this.onAddWeight = onAddWeight;
    this.onDeleteWeight = onDeleteWeight;

    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('submit', (e) => {
      const form = e.target.closest('#body-weight-form');
      if (!form) return;
      e.preventDefault();

      const dateInput = form.querySelector('#bw-date');
      const weightInput = form.querySelector('#bw-weight');
      const unitSelect = form.querySelector('#bw-unit');
      const notesInput = form.querySelector('#bw-notes');

      const date = dateInput.value.trim();
      const weight = parseFloat(weightInput.value) || 0;
      const unit = unitSelect ? unitSelect.value : 'kg';
      const notes = notesInput ? notesInput.value.trim() : '';

      if (!date) {
        alert('Please select a date.');
        return;
      }
      if (weight <= 0) {
        alert('Please enter a valid weight.');
        return;
      }

      this.onAddWeight({
        date,
        weight,
        unit,
        notes
      });
    });

    this.container.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-bw');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (id) {
          this.onDeleteWeight(id);
        }
      }
    });
  }

  render(todayStr) {
    const logs = this.fitnessService.getBodyWeightLogs();
    const stats = this.fitnessService.getWeightStats();

    const rowsHtml = logs.length === 0
      ? `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">No body weight entries yet. Record your daily weigh-in above!</td></tr>`
      : logs
          .map((w, index) => {
            const nextOlder = logs[index + 1];
            let deltaHtml = '<span class="text-muted">-</span>';
            if (nextOlder) {
              const diff = +(w.weight - nextOlder.weight).toFixed(2);
              if (diff < 0) {
                deltaHtml = `<span class="text-success font-semibold font-mono">${diff} ${w.unit}</span>`;
              } else if (diff > 0) {
                deltaHtml = `<span class="text-warning font-semibold font-mono">+${diff} ${w.unit}</span>`;
              } else {
                deltaHtml = `<span class="text-muted font-mono">0.0 ${w.unit}</span>`;
              }
            }

            return `
        <tr class="table-row">
          <td class="font-mono text-xs">${this.escape(w.date)}</td>
          <td class="font-mono font-bold text-primary">${w.weight} ${w.unit}</td>
          <td>${deltaHtml}</td>
          <td class="text-muted text-xs">${this.escape(w.notes || '-')}</td>
          <td class="text-right">
            <button type="button" class="btn-icon btn-delete-bw text-danger" data-id="${w.id}" title="Delete weigh-in">✕</button>
          </td>
        </tr>
      `;
          })
          .join('');

    const latestVal = stats.latest ? `${stats.latest.weight} ${stats.latest.unit}` : '--';
    const totalChangeVal = stats.latest
      ? `${stats.changeTotal > 0 ? '+' : ''}${stats.changeTotal} ${stats.latest.unit}`
      : '--';
    const changeClass = stats.changeTotal < 0 ? 'text-success' : (stats.changeTotal > 0 ? 'text-warning' : 'text-primary');

    this.container.innerHTML = `
      <div class="fitness-card">
        <!-- Quick Stats Banner -->
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-label">Current Weight</span>
            <span class="stat-val text-primary font-mono">${latestVal}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Net Overall Change</span>
            <span class="stat-val ${changeClass} font-mono">${totalChangeVal}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Weigh-in Entries</span>
            <span class="stat-val text-accent font-mono">${logs.length} logged</span>
          </div>
        </div>

        <!-- Form Card -->
        <div class="logger-box">
          <div class="logger-header">
            <h4>⚖️ Record Daily Body Weight</h4>
            <span class="text-muted text-xs">Track progress, weigh-in notes & trends</span>
          </div>

          <form id="body-weight-form" class="form-grid">
            <div class="form-group flex-1">
              <label for="bw-date">Date</label>
              <input type="date" id="bw-date" class="input font-mono" required value="${todayStr}">
            </div>

            <div class="form-group flex-1">
              <label for="bw-weight">Body Weight</label>
              <div class="input-with-select">
                <input type="number" id="bw-weight" class="input font-mono" step="0.1" min="10" max="400" placeholder="75.0" required value="${stats.latest ? stats.latest.weight : '75.0'}">
                <select id="bw-unit" class="select-inline">
                  <option value="kg" ${stats.latest?.unit === 'lbs' ? '' : 'selected'}>kg</option>
                  <option value="lbs" ${stats.latest?.unit === 'lbs' ? 'selected' : ''}>lbs</option>
                </select>
              </div>
            </div>

            <div class="form-group flex-2">
              <label for="bw-notes">Condition / Notes</label>
              <input type="text" id="bw-notes" class="input" placeholder="e.g. Morning fasted, post hydration" value="Morning fasted">
            </div>

            <div class="form-group form-action">
              <button type="submit" class="btn btn-primary btn-block">+ Log Weight</button>
            </div>
          </form>
        </div>

        <!-- Weight History Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>Delta vs Previous</th>
                <th>Condition / Note</th>
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
