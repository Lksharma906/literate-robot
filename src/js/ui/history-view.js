import { formatDateForDisplay } from '../services/date-utils.js';

/**
 * HistoryView manages the Habit Details & 30-Day Completion History Modal.
 */
export class HistoryView {
  /**
   * @param {Object} options
   * @param {Function} options.onHabitLoaded - Callback when habit is displayed (used to update HabitManageView)
   */
  constructor({ onHabitLoaded }) {
    this.onHabitLoaded = onHabitLoaded;

    this.modal = document.getElementById('history-modal');
    this.titleEl = document.getElementById('history-modal-title');
    this.subtitleEl = document.getElementById('history-subtitle');
    this.currentStreakEl = document.getElementById('stat-current-streak');
    this.longestStreakEl = document.getElementById('stat-longest-streak');
    this.totalCompletionsEl = document.getElementById('stat-total-completions');
    this.rate30dEl = document.getElementById('stat-rate-30d');
    this.gridEl = document.getElementById('history-grid');
    this.closeBtn = document.getElementById('btn-close-history');

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close());

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  /**
   * Opens history modal for a specific habit.
   * @param {Object} habit
   * @param {Object} stats
   * @param {string} todayStr
   */
  open(habit, stats, todayStr) {
    if (!habit) return;

    this.titleEl.textContent = habit.name;
    this.subtitleEl.textContent = `Tracking since ${formatDateForDisplay(habit.createdAt)}`;

    this.currentStreakEl.textContent = `${stats.currentStreak}d`;
    this.longestStreakEl.textContent = `${stats.longestStreak}d`;
    this.totalCompletionsEl.textContent = stats.totalCompletions;
    this.rate30dEl.textContent = `${stats.rate30d}%`;

    this.renderGrid(stats.history30d, todayStr);

    if (this.onHabitLoaded) {
      this.onHabitLoaded(habit);
    }

    this.modal.showModal();
  }

  renderGrid(history30d, todayStr) {
    this.gridEl.innerHTML = '';

    if (!Array.isArray(history30d)) return;

    for (const item of history30d) {
      const cell = document.createElement('div');
      cell.className = `history-cell ${item.completed ? 'completed' : ''} ${item.date === todayStr ? 'today' : ''}`;

      // Extract day number (e.g., "28")
      const dayNum = item.date.slice(-2);
      cell.textContent = parseInt(dayNum, 10);

      const statusText = item.completed ? 'Completed' : 'Not completed';
      const formattedDate = formatDateForDisplay(item.date);
      cell.title = `${formattedDate}: ${statusText}`;
      cell.setAttribute('aria-label', `${formattedDate}: ${statusText}`);

      this.gridEl.appendChild(cell);
    }
  }

  close() {
    this.modal?.close();
  }
}
