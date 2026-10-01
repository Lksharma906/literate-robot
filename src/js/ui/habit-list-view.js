/**
 * HabitListView handles DOM rendering for habit cards and empty state.
 */
export class HabitListView {
  /**
   * @param {HTMLElement} listElement
   * @param {HTMLElement} emptyStateElement
   */
  constructor(listElement, emptyStateElement) {
    this.listElement = listElement;
    this.emptyStateElement = emptyStateElement;
  }

  /**
   * Renders the collection of habits.
   * @param {Array<Object>} habits
   * @param {Object} service - HabitService instance
   * @param {string} todayStr - YYYY-MM-DD
   */
  render(habits, service, todayStr) {
    this.listElement.innerHTML = '';

    if (!habits || habits.length === 0) {
      this.emptyStateElement.classList.remove('hidden');
      this.listElement.classList.add('hidden');
      return;
    }

    this.emptyStateElement.classList.add('hidden');
    this.listElement.classList.remove('hidden');

    for (const habit of habits) {
      const stats = service.getStats(habit.id, todayStr);
      const isCompleted = service.isCompleted(habit.id, todayStr);
      const card = this.createHabitCard(habit, stats, isCompleted);
      this.listElement.appendChild(card);
    }
  }

  /**
   * Creates a DOM element for a single habit card.
   * @param {Object} habit
   * @param {Object} stats
   * @param {boolean} isCompleted
   * @returns {HTMLElement}
   */
  createHabitCard(habit, stats, isCompleted) {
    const li = document.createElement('li');
    li.className = `habit-card ${isCompleted ? 'completed' : ''}`;
    li.dataset.habitId = habit.id;

    // Card Left: Info (Title & Streak badges)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'habit-info';
    infoDiv.setAttribute('role', 'button');
    infoDiv.setAttribute('tabindex', '0');
    infoDiv.setAttribute('aria-label', `View history for ${habit.name}`);

    const titleEl = document.createElement('div');
    titleEl.className = 'habit-title';
    titleEl.textContent = habit.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'habit-meta';

    const streakBadge = document.createElement('span');
    streakBadge.className = 'streak-badge';
    streakBadge.innerHTML = `🔥 ${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`;

    const longestBadge = document.createElement('span');
    longestBadge.className = 'text-muted';
    longestBadge.textContent = `Best: ${stats.longestStreak}`;

    metaEl.appendChild(streakBadge);
    metaEl.appendChild(longestBadge);

    if (habit.archived) {
      const archivedBadge = document.createElement('span');
      archivedBadge.className = 'sync-badge';
      archivedBadge.textContent = 'Archived';
      metaEl.appendChild(archivedBadge);
    }

    infoDiv.appendChild(titleEl);
    infoDiv.appendChild(metaEl);

    // Card Right: 1-Tap Check-In Button
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = `check-btn ${isCompleted ? 'checked' : ''}`;
    checkBtn.dataset.action = 'toggle';
    checkBtn.dataset.habitId = habit.id;
    checkBtn.setAttribute('aria-pressed', isCompleted ? 'true' : 'false');
    checkBtn.setAttribute(
      'aria-label',
      isCompleted
        ? `Mark "${habit.name}" incomplete for today`
        : `Mark "${habit.name}" completed for today`
    );
    checkBtn.innerHTML = isCompleted ? '✓' : '';

    li.appendChild(infoDiv);
    li.appendChild(checkBtn);

    return li;
  }
}
