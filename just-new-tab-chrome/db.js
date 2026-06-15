class JustDB {
  constructor() {
    this.dbName = 'JustNewTabDB';
    this.dbVersion = 1;
    this.storeName = 'custom_wallpapers';
    this.db = null;
  }

  /**
   * Initializes the database connection.
   * @returns {Promise<IDBDatabase>}
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database failed to open:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Adds a new custom wallpaper.
   * @param {string} name 
   * @param {Blob} blob 
   * @param {string|null} packageId
   * @param {string|null} packageName
   * @returns {Promise<number>} The ID of the inserted wallpaper
   */
  async addWallpaper(name, blob, packageId = null, packageName = null) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const wallpaper = {
        name: name,
        blob: blob,
        addedAt: new Date().getTime(),
        active: true,
        packageId: packageId,
        packageName: packageName
      };

      const request = store.add(wallpaper);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Retrieves all custom wallpapers.
   * @returns {Promise<Array>} List of wallpaper objects
   */
  async getAllWallpapers() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Toggles the active state of a wallpaper.
   * @param {number} id 
   * @param {boolean} active 
   * @returns {Promise<void>}
   */
  async setWallpaperActive(id, active) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.active = active;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = (event) => reject(event.target.error);
        } else {
          reject(new Error('Wallpaper not found'));
        }
      };

      getRequest.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * Deletes a wallpaper.
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteWallpaper(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Removes every stored wallpaper. Used when restoring a backup so the
   * imported set fully replaces the existing one.
   * @returns {Promise<void>}
   */
  async clearAllWallpapers() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}

// Export as a global class or instantiable object
window.justDB = new JustDB();
