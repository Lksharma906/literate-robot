import { Habit } from '../models/habit.js';

/**
 * HabitFormView manages the Add / Edit Habit modal dialog.
 */
export class HabitFormView {
  /**
   * @param {Object} options
   * @param {Function} options.onSave - Callback when habit is successfully saved
   */
  constructor({ onSave }) {
    this.onSave = onSave;

    this.modal = document.getElementById('habit-modal');
    this.form = document.getElementById('habit-form');
    this.titleEl = document.getElementById('modal-title');
    this.idInput = document.getElementById('edit-habit-id');
    this.nameInput = document.getElementById('habit-name-input');
    this.errorEl = document.getElementById('habit-name-error');
    this.closeBtn = document.getElementById('btn-close-modal');
    this.cancelBtn = document.getElementById('btn-cancel-habit');

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.cancelBtn?.addEventListener('click', () => this.close());

    // Clear error on input typing
    this.nameInput?.addEventListener('input', () => {
      this.clearError();
    });

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Close when clicking modal backdrop
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  /**
   * Opens modal to create a new habit.
   */
  openCreate() {
    this.titleEl.textContent = 'Create New Habit';
    this.idInput.value = '';
    this.nameInput.value = '';
    this.clearError();
    this.modal.showModal();
    this.nameInput.focus();
  }

  /**
   * Opens modal to edit an existing habit.
   * @param {Object} habit
   */
  openEdit(habit) {
    this.titleEl.textContent = 'Edit Habit';
    this.idInput.value = habit.id;
    this.nameInput.value = habit.name;
    this.clearError();
    this.modal.showModal();
    this.nameInput.focus();
  }

  close() {
    this.clearError();
    this.modal?.close();
  }

  clearError() {
    if (this.errorEl) {
      this.errorEl.textContent = '';
    }
  }

  showError(msg) {
    if (this.errorEl) {
      this.errorEl.textContent = msg;
    }
  }

  handleSubmit() {
    const rawName = this.nameInput.value;
    const validation = Habit.validateName(rawName);

    if (!validation.valid) {
      this.showError(validation.error);
      this.nameInput.focus();
      return;
    }

    const id = this.idInput.value || undefined;
    const name = rawName.trim();

    try {
      this.onSave({ id, name });
      this.close();
    } catch (err) {
      this.showError(err.message);
    }
  }
}
