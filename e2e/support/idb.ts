import type { Page } from '@playwright/test';

/**
 * Acceso directo a IndexedDB ("GymTracker"), independiente del código de la app.
 * Sirve para sembrar datos (arrange) y verificar lo que quedó guardado (assert).
 */
const DB_NAME = 'GymTracker';

export type StoreName = 'variaciones' | 'historialPesos' | 'entrenamientos' | 'config';

export const idb = {
  getAll<T = any>(page: Page, store: StoreName): Promise<T[]> {
    return page.evaluate(
      ({ DB_NAME, store }) =>
        new Promise<any[]>((resolve, reject) => {
          const open = indexedDB.open(DB_NAME);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const req = db.transaction(store, 'readonly').objectStore(store).getAll();
            req.onsuccess = () => { db.close(); resolve(req.result); };
            req.onerror = () => { db.close(); reject(req.error); };
          };
        }),
      { DB_NAME, store },
    );
  },

  get<T = any>(page: Page, store: StoreName, key: string | number | Array<string | number>): Promise<T | undefined> {
    return page.evaluate(
      ({ DB_NAME, store, key }) =>
        new Promise<any>((resolve, reject) => {
          const open = indexedDB.open(DB_NAME);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const req = db.transaction(store, 'readonly').objectStore(store).get(key);
            req.onsuccess = () => { db.close(); resolve(req.result); };
            req.onerror = () => { db.close(); reject(req.error); };
          };
        }),
      { DB_NAME, store, key },
    );
  },

  put(page: Page, store: StoreName, records: object | object[]): Promise<void> {
    const list = Array.isArray(records) ? records : [records];
    return page.evaluate(
      ({ DB_NAME, store, list }) =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open(DB_NAME);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction(store, 'readwrite');
            const os = tx.objectStore(store);
            list.forEach((r) => os.put(r));
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
          };
        }),
      { DB_NAME, store, list },
    );
  },
};
