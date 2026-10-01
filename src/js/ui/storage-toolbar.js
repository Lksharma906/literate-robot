import { StorageAdapter } from '../storage/file-adapter.js';
import { parseCSV, serializeCSV } from '../storage/csv.js';
import { LocalCache } from '../storage/local-cache.js';

/**
 * StorageToolbarView coordinates storage actions: Open CSV, Import, and Export.
 * Unified to handle habits, gym strength logs, cardio, and body weight entries.
 */
export class StorageToolbarView {
  /**
   * @param {Object} options
   * @param {Object} options.service - HabitService
   * @param {Object} [options.fitnessService] - FitnessService
   * @param {Function} options.onNotify - (message, type) => void
   * @param {Function} options.onStateChange - () => void
   */
  constructor({ service, fitnessService, onNotify, onStateChange }) {
    this.service = service;
    this.fitnessService = fitnessService;
    this.onNotify = onNotify;
    this.onStateChange = onStateChange;

    this.fileHandle = null;
    this.activeFilename = null;
    this.isDirty = false;

    // DOM Elements
    this.openBtn = document.getElementById('btn-open-file');
    this.importBtn = document.getElementById('btn-import-csv');
    this.fileInput = document.getElementById('file-input');
    this.exportBtn = document.getElementById('btn-export-csv');
    this.statusBadge = document.getElementById('sync-status');

    this.bindEvents();
    this.checkLocalRecovery();
  }

  bindEvents() {
    this.openBtn?.addEventListener('click', () => this.handleOpenFile());
    this.importBtn?.addEventListener('click', () => this.fileInput?.click());
    this.fileInput?.addEventListener('change', (e) => this.handleFileInputChange(e));
    this.exportBtn?.addEventListener('click', () => this.handleExportCSV());

    // Warn on leaving tab if unsaved changes exist and not using File System Access handle
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty && !this.fileHandle) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Would you like to export your CSV first?';
      }
    });
  }

  getFullExportState() {
    const habitState = this.service.exportState();
    const fitnessState = this.fitnessService ? this.fitnessService.exportState() : {};
    return {
      ...habitState,
      ...fitnessState
    };
  }

  checkLocalRecovery() {
    const backup = LocalCache.getBackup();
    if (backup && backup.data) {
      const data = backup.data;
      if (Array.isArray(data.habits) && data.habits.length > 0) {
        const current = this.service.getHabits('all');
        if (current.length === 0 || (current.length === 3 && current[0].name === 'Drink 2L Water')) {
          console.log('Restoring previous unsaved habits from localStorage backup.');
          this.service.importState(data);
          this.updateSyncStatus('Restored');
          this.onNotify('Restored previous habits from session backup.', 'info');
        }
      }

      if (this.fitnessService && (data.gymSets?.length > 0 || data.cardioLogs?.length > 0 || data.bodyWeights?.length > 0)) {
        this.fitnessService.importState(data);
      }
    }
  }

  markDirty() {
    this.isDirty = true;
    LocalCache.saveBackup(this.getFullExportState());

    if (this.fileHandle) {
      this.autoSaveToFile();
    } else {
      this.updateSyncStatus('Unsaved', 'dirty');
    }
  }

  async autoSaveToFile() {
    if (!this.fileHandle) return;
    try {
      const csvText = serializeCSV(this.getFullExportState());
      await StorageAdapter.saveToFileHandle(this.fileHandle, csvText);
      this.isDirty = false;
      this.updateSyncStatus(`Saved (${this.activeFilename || 'file'})`, 'saved');
    } catch (err) {
      console.warn('Auto-save to file failed:', err);
      this.updateSyncStatus('Save Error', 'dirty');
    }
  }

  updateSyncStatus(text, className = '') {
    if (!this.statusBadge) return;
    this.statusBadge.textContent = text;
    this.statusBadge.className = `sync-badge ${className}`;
  }

  async handleOpenFile() {
    if (!StorageAdapter.isFileSystemAccessSupported()) {
      this.onNotify(
        'Direct file access is supported in Chrome/Edge. Falling back to Import CSV for your browser.',
        'info'
      );
      this.fileInput?.click();
      return;
    }

    try {
      const { text, handle, filename } = await StorageAdapter.openFile();
      this.processCSVContent(text, filename);
      this.fileHandle = handle;
      this.activeFilename = filename;
      this.isDirty = false;
      this.updateSyncStatus(`Linked: ${filename}`, 'saved');
      this.onNotify(`Successfully opened and linked "${filename}". Changes will auto-save directly!`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error opening file:', err);
        this.onNotify(`Failed to open file: ${err.message}`, 'error');
      }
    }
  }

  async handleFileInputChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await StorageAdapter.readFileAsText(file);
      this.processCSVContent(text, file.name);
      this.fileHandle = null;
      this.activeFilename = file.name;
      this.isDirty = false;
      this.updateSyncStatus(`Imported: ${file.name}`, 'saved');
      this.onNotify(`Imported tracker data from "${file.name}".`, 'success');
    } catch (err) {
      console.error('Error importing file:', err);
      this.onNotify(`Error importing CSV: ${err.message}`, 'error');
    } finally {
      this.fileInput.value = '';
    }
  }

  processCSVContent(text, filename) {
    const parsed = parseCSV(text);

    if (parsed.errors.length > 0) {
      const sample = parsed.errors.slice(0, 3).map(e => `Row ${e.rowNumber}: ${e.reason}`).join('\n');
      const more = parsed.errors.length > 3 ? `\n...and ${parsed.errors.length - 3} more.` : '';
      window.alert(
        `Notice while parsing "${filename}":\nSome rows had formatting issues and were skipped non-destructively:\n\n${sample}${more}`
      );
    }

    this.service.importState({
      habits: parsed.habits,
      logs: parsed.logs
    });

    if (this.fitnessService) {
      this.fitnessService.importState({
        gymSets: parsed.gymSets,
        cardioLogs: parsed.cardioLogs,
        bodyWeights: parsed.bodyWeights
      });
    }

    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  handleExportCSV() {
    try {
      const fullState = this.getFullExportState();
      const csvText = serializeCSV(fullState);
      const filename = this.activeFilename || 'tracker_and_fitness.csv';
      StorageAdapter.downloadFile(csvText, filename);
      this.isDirty = false;
      this.updateSyncStatus('Exported', 'saved');
      this.onNotify(`Exported habits, gym logs, cardio & weight to "${filename}".`, 'success');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      this.onNotify(`Export failed: ${err.message}`, 'error');
    }
  }
}
