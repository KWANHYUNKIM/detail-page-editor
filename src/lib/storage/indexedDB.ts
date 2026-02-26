/**
 * IndexedDB wrapper for project persistence.
 *
 * Why IndexedDB instead of localStorage:
 * - localStorage has a ~5MB limit — a single project with images as data URLs can exceed this.
 * - IndexedDB supports hundreds of MB+ per origin.
 * - Async API doesn't block the main thread.
 */

const DB_NAME = 'detail-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProjects<T>(): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getProject<T>(id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function putProject<T>(project: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(project);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Migrate existing projects from localStorage to IndexedDB (one-time).
 * After migration, the localStorage key is removed.
 */
const LEGACY_STORAGE_KEY = 'detail-editor-projects';

export async function migrateFromLocalStorage<T extends { id: string }>(): Promise<void> {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  try {
    const projects: T[] = JSON.parse(raw);
    if (!Array.isArray(projects) || projects.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const project of projects) {
      store.put(project);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    // Remove legacy data after successful migration
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.info(`[storage] Migrated ${projects.length} projects from localStorage → IndexedDB`);
  } catch (err) {
    console.warn('[storage] localStorage migration failed:', err);
  }
}
