/**
 * Dual-Mode Storage Adapter for Simple Streak Tracker.
 * Supports the modern File System Access API (when available in Chromium browsers)
 * with universal cross-browser fallback to standard HTML5 File input & Blob download.
 */
export class StorageAdapter {
  /**
   * Checks if the modern File System Access API is supported.
   * @returns {boolean}
   */
  static isFileSystemAccessSupported() {
    return typeof window !== 'undefined' &&
      typeof window.showOpenFilePicker === 'function' &&
      typeof window.showSaveFilePicker === 'function';
  }

  /**
   * Prompts user to select a CSV file via File System Access API.
   * @returns {Promise<{ text: string, handle: FileSystemFileHandle, filename: string }>}
   */
  static async openFile() {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'CSV Files (*.csv)',
          accept: {
            'text/csv': ['.csv'],
            'text/plain': ['.csv', '.txt']
          }
        }
      ],
      multiple: false
    });

    const file = await handle.getFile();
    const text = await file.text();
    return { text, handle, filename: file.name };
  }

  /**
   * Writes text directly to an already opened FileSystemFileHandle.
   * @param {FileSystemFileHandle} handle
   * @param {string} text
   * @returns {Promise<void>}
   */
  static async saveToFileHandle(handle, text) {
    if (!handle) {
      throw new Error('No active file handle provided.');
    }
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  /**
   * Prompts "Save As" file picker and writes content.
   * @param {string} text
   * @param {string} [suggestedName='habits.csv']
   * @returns {Promise<FileSystemFileHandle>}
   */
  static async saveFileAs(text, suggestedName = 'habits.csv') {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'CSV Files (*.csv)',
          accept: {
            'text/csv': ['.csv']
          }
        }
      ]
    });

    await this.saveToFileHandle(handle, text);
    return handle;
  }

  /**
   * Universal Fallback: Reads a standard File object from HTML <input type="file">.
   * @param {File} file
   * @returns {Promise<string>}
   */
  static async readFileAsText(file) {
    if (!file) {
      throw new Error('No file provided.');
    }
    if (typeof file.text === 'function') {
      return await file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Universal Fallback: Triggers browser download for CSV file without server involvement.
   * @param {string} text
   * @param {string} [filename='habits.csv']
   */
  static downloadFile(text, filename = 'habits.csv') {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
