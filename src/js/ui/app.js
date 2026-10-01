import { HabitService } from '../services/habit-service.js';
import { FitnessService } from '../services/fitness-service.js';
import { getLocalDateString, formatDateForDisplay } from '../services/date-utils.js';
import { HabitListView } from './habit-list-view.js';
import { HabitFormView } from './habit-form-view.js';
import { HabitManageView } from './habit-manage-view.js';
import { HistoryView } from './history-view.js';
import { StorageToolbarView } from './storage-toolbar.js';
import { GymView } from './gym-view.js';
import { CardioView } from './cardio-view.js';
import { BodyWeightView } from './body-weight-view.js';

/**
 * Main application coordinator for Simple Streak & Fitness Tracker.
 */
class App {
  constructor() {
    this.service = new HabitService();
    this.fitnessService = new FitnessService();
    this.todayStr = getLocalDateString();
    this.activeFilter = 'active';
    this.currentModule = 'habits';

    // DOM Elements
    this.dateDisplay = document.getElementById('date-display');
    this.habitListEl = document.getElementById('habit-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.filterTabs = document.querySelectorAll('.tab-btn');
    this.addHabitBtn = document.getElementById('btn-add-habit');
    this.emptyAddBtn = document.getElementById('btn-empty-add');
    this.moduleTabs = document.querySelectorAll('.module-tab');

    // Module Views Containers
    this.moduleViews = {
      habits: document.getElementById('module-habits'),
      gym: document.getElementById('module-gym'),
      cardio: document.getElementById('module-cardio'),
      weight: document.getElementById('module-weight')
    };

    // Storage Toolbar (coordinates unified habits + fitness state)
    this.storageToolbar = new StorageToolbarView({
      service: this.service,
      fitnessService: this.fitnessService,
      onNotify: (msg, type) => this.showToast(msg, type),
      onStateChange: () => this.render()
    });

    // Views
    this.listView = new HabitListView(this.habitListEl, this.emptyStateEl);
    this.formView = new HabitFormView({
      onSave: (data) => this.handleSaveHabit(data)
    });
    this.manageView = new HabitManageView({
      onArchive: (id, willArchive) => this.handleArchiveHabit(id, willArchive),
      onDelete: (id) => this.handleDeleteHabit(id),
      onEdit: (habit) => this.handleEditHabit(habit)
    });
    this.historyView = new HistoryView({
      onHabitLoaded: (habit) => this.manageView.setActiveHabit(habit)
    });

    // Fitness Views
    this.gymView = new GymView({
      container: this.moduleViews.gym,
      fitnessService: this.fitnessService,
      onAddSet: (data) => this.handleAddGymSet(data),
      onDeleteSet: (id) => this.handleDeleteGymSet(id)
    });

    this.cardioView = new CardioView({
      container: this.moduleViews.cardio,
      fitnessService: this.fitnessService,
      onAddCardio: (data) => this.handleAddCardio(data),
      onDeleteCardio: (id) => this.handleDeleteCardio(id)
    });

    this.bodyWeightView = new BodyWeightView({
      container: this.moduleViews.weight,
      fitnessService: this.fitnessService,
      onAddWeight: (data) => this.handleAddBodyWeight(data),
      onDeleteWeight: (id) => this.handleDeleteBodyWeight(id)
    });

    window.openHabitHistory = (habitId) => this.openHabitHistory(habitId);

    this.init();
  }

  openHabitHistory(habitId) {
    const habit = this.service.getHabit(habitId);
    if (!habit) return;
    const stats = this.service.getStats(habitId, this.todayStr);
    this.historyView.open(habit, stats, this.todayStr);
  }

  init() {
    this.updateDateDisplay();
    this.setupEventListeners();
    this.setupMidnightTimer();

    // Subscribe view rendering to state changes
    this.service.subscribe(() => {
      this.render();
    });

    this.fitnessService.subscribe(() => {
      this.render();
    });

    // Provide initial sample habits if completely empty first-time user
    const existing = this.service.getHabits('all');
    if (existing.length === 0) {
      this.loadSampleData();
    } else {
      this.render();
    }
  }

  loadSampleData() {
    this.service.createHabit('Drink 2L Water');
    this.service.createHabit('Read 20 Mins');
    this.service.createHabit('Morning Stretch');

    // Provide helpful starter gym sets & cardio demo entries
    this.fitnessService.addGymSet({
      exercise: 'Bench Press',
      date: this.todayStr,
      weight: 60,
      reps: 10,
      unit: 'kg'
    });
    this.fitnessService.addGymSet({
      exercise: 'Bench Press',
      date: this.todayStr,
      weight: 65,
      reps: 8,
      unit: 'kg'
    });
    this.fitnessService.addCardioLog({
      activity: 'Treadmill Running',
      date: this.todayStr,
      duration: 20,
      distance: 3.0,
      calories: 180,
      notes: 'Warmup'
    });
    this.fitnessService.addBodyWeightLog({
      date: this.todayStr,
      weight: 75.0,
      unit: 'kg',
      notes: 'Initial weigh-in'
    });
  }

  updateDateDisplay() {
    this.todayStr = getLocalDateString();
    if (this.dateDisplay) {
      this.dateDisplay.textContent = formatDateForDisplay(this.todayStr, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  setupMidnightTimer() {
    // Check every 30 seconds if calendar date has changed
    setInterval(() => {
      const current = getLocalDateString();
      if (current !== this.todayStr) {
        console.log(`Midnight crossed: Rolled over from ${this.todayStr} to ${current}`);
        this.todayStr = current;
        this.updateDateDisplay();
        this.render();
      }
    }, 30000);
  }

  setupEventListeners() {
    // Module Tab Switcher
    this.moduleTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchModule(tab.dataset.module || 'habits');
      });
    });

    // Add Habit buttons
    this.addHabitBtn?.addEventListener('click', () => {
      this.formView.openCreate();
    });

    this.emptyAddBtn?.addEventListener('click', () => {
      this.formView.openCreate();
    });

    // Filter Tabs for Habits
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.activeFilter = tab.dataset.filter || 'active';
        this.render();
      });
    });

    // Delegated click handling on habit list
    this.habitListEl.addEventListener('click', (e) => {
      const checkBtn = e.target.closest('.check-btn');
      if (checkBtn) {
        e.stopPropagation();
        const habitId = checkBtn.dataset.habitId;
        if (habitId) {
          this.handleToggleCompletion(habitId);
        }
        return;
      }

      const habitInfo = e.target.closest('.habit-info');
      if (habitInfo) {
        const card = habitInfo.closest('.habit-card');
        const habitId = card?.dataset.habitId;
        if (habitId && window.openHabitHistory) {
          window.openHabitHistory(habitId);
        }
      }
    });

    // Keyboard support for habit info cards
    this.habitListEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const habitInfo = e.target.closest('.habit-info');
        if (habitInfo) {
          e.preventDefault();
          const card = habitInfo.closest('.habit-card');
          const habitId = card?.dataset.habitId;
          if (habitId && window.openHabitHistory) {
            window.openHabitHistory(habitId);
          }
        }
      }
    });
  }

  switchModule(moduleName) {
    this.currentModule = moduleName;

    this.moduleTabs.forEach(tab => {
      const isMatch = tab.dataset.module === moduleName;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    for (const [key, container] of Object.entries(this.moduleViews)) {
      if (container) {
        container.classList.toggle('hidden', key !== moduleName);
      }
    }

    this.render();
  }

  /* =========================================================================
     HABIT EVENT HANDLERS
     ========================================================================= */

  handleSaveHabit({ id, name }) {
    if (id) {
      this.service.updateHabit(id, { name });
      this.showToast(`Updated habit: "${name}"`);
    } else {
      const newHabit = this.service.createHabit(name);
      this.showToast(`Created habit: "${newHabit.name}"`);
    }
    this.storageToolbar?.markDirty();
  }

  handleArchiveHabit(id, willArchive) {
    const habit = this.service.archiveHabit(id, willArchive);
    this.showToast(willArchive ? `Archived "${habit.name}"` : `Unarchived "${habit.name}"`);
    document.getElementById('history-modal')?.close();
    this.storageToolbar?.markDirty();
  }

  handleDeleteHabit(id) {
    const habit = this.service.getHabit(id);
    const name = habit?.name || '';
    this.service.deleteHabit(id);
    this.showToast(`Deleted habit "${name}"`);
    document.getElementById('history-modal')?.close();
    this.storageToolbar?.markDirty();
  }

  handleEditHabit(habit) {
    document.getElementById('history-modal')?.close();
    this.formView.openEdit(habit);
  }

  handleToggleCompletion(habitId) {
    try {
      const isNowCompleted = this.service.toggleCompletion(habitId, this.todayStr);
      const habit = this.service.getHabit(habitId);
      const stats = this.service.getStats(habitId, this.todayStr);

      const message = isNowCompleted
        ? `Checked in: "${habit?.name}" (Streak: ${stats.currentStreak} 🔥)`
        : `Unchecked: "${habit?.name}"`;

      this.showToast(message);
      this.storageToolbar?.markDirty();
    } catch (err) {
      console.error('Error toggling completion:', err);
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  /* =========================================================================
     FITNESS & WORKOUT EVENT HANDLERS
     ========================================================================= */

  handleAddGymSet(data) {
    const set = this.fitnessService.addGymSet({
      ...data,
      date: this.todayStr
    });
    this.showToast(`Logged Set ${set.setNum}: ${set.exercise} (${set.weight} ${set.unit} × ${set.reps})`);
    this.storageToolbar?.markDirty();
  }

  handleDeleteGymSet(id) {
    this.fitnessService.deleteGymSet(id);
    this.showToast('Deleted gym set');
    this.storageToolbar?.markDirty();
  }

  handleAddCardio(data) {
    const log = this.fitnessService.addCardioLog({
      ...data,
      date: this.todayStr
    });
    this.showToast(`Recorded: ${log.activity} (${log.duration} mins)`);
    this.storageToolbar?.markDirty();
  }

  handleDeleteCardio(id) {
    this.fitnessService.deleteCardioLog(id);
    this.showToast('Deleted cardio activity');
    this.storageToolbar?.markDirty();
  }

  handleAddBodyWeight(data) {
    const log = this.fitnessService.addBodyWeightLog(data);
    this.showToast(`Recorded weight: ${log.weight} ${log.unit}`);
    this.storageToolbar?.markDirty();
  }

  handleDeleteBodyWeight(id) {
    this.fitnessService.deleteBodyWeightLog(id);
    this.showToast('Deleted weight log');
    this.storageToolbar?.markDirty();
  }

  /* =========================================================================
     RENDER
     ========================================================================= */

  render() {
    if (this.currentModule === 'habits') {
      const habits = this.service.getHabits(this.activeFilter);
      this.listView.render(habits, this.service, this.todayStr);
    } else if (this.currentModule === 'gym') {
      this.gymView.render(this.todayStr);
    } else if (this.currentModule === 'cardio') {
      this.cardioView.render(this.todayStr);
    } else if (this.currentModule === 'weight') {
      this.bodyWeightView.render(this.todayStr);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Instantiate app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.__streakApp = new App();
});
