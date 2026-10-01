/**
 * HabitManageView handles habit administrative actions (archive, unarchive, delete).
 */
export class HabitManageView {
  /**
   * @param {Object} options
   * @param {Function} options.onArchive - (id, isArchived) => void
   * @param {Function} options.onDelete - (id) => void
   * @param {Function} options.onEdit - (habit) => void
   */
  constructor({ onArchive, onDelete, onEdit }) {
    this.onArchive = onArchive;
    this.onDelete = onDelete;
    this.onEdit = onEdit;

    this.archiveBtn = document.getElementById('btn-archive-habit');
    this.deleteBtn = document.getElementById('btn-delete-habit');
    this.currentHabit = null;

    this.bindEvents();
  }

  bindEvents() {
    this.archiveBtn?.addEventListener('click', () => {
      if (!this.currentHabit) return;
      const willArchive = !this.currentHabit.archived;
      this.onArchive(this.currentHabit.id, willArchive);
    });

    this.deleteBtn?.addEventListener('click', () => {
      if (!this.currentHabit) return;
      const confirmed = window.confirm(
        `Are you sure you want to delete "${this.currentHabit.name}"?\nThis will remove the habit and all its history.`
      );
      if (confirmed) {
        this.onDelete(this.currentHabit.id);
      }
    });
  }

  /**
   * Sets the active habit being inspected/managed in the modal.
   * @param {Object} habit
   */
  setActiveHabit(habit) {
    this.currentHabit = habit;
    if (this.archiveBtn && habit) {
      this.archiveBtn.textContent = habit.archived ? 'Unarchive Habit' : 'Archive Habit';
    }
  }
}
