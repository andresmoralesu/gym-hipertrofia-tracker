/**
 * 🗄️ INICIALIZADOR DE INDEXEDDB
 *
 * Crea las 4 tiendas (stores) necesarias:
 * 1. variaciones - Contiene las 4-5 variaciones pre-cargadas por día
 * 2. historialPesos - Registros de pesos por ejercicio por semana
 * 3. entrenamientos - Logs de entrenamientos completados
 * 4. config - Configuración y tokens (Google, última sincronización, etc.)
 */

import { CONFIG } from "./config.js";

let db = null;

/**
 * Inicializa IndexedDB con el esquema correcto
 * @returns {Promise<IDBDatabase>}
 */
export function inicializarDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

    // Evento: primera vez que se crea o versión actualizada
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      console.log("🔧 Creando stores de IndexedDB...");

      // Store 1: Variaciones (ejercicios pre-cargados)
      if (!database.objectStoreNames.contains(CONFIG.STORES.VARIACIONES)) {
        const varStore = database.createObjectStore(CONFIG.STORES.VARIACIONES, {
          keyPath: ["diaId", "numeroVariacion"]
        });
        varStore.createIndex("diaId", "diaId", { unique: false });
        console.log("✅ Store 'variaciones' creado");
      }

      // Store 2: Historial de Pesos
      if (!database.objectStoreNames.contains(CONFIG.STORES.HISTORIAL_PESOS)) {
        const pesoStore = database.createObjectStore(
          CONFIG.STORES.HISTORIAL_PESOS,
          { keyPath: "id", autoIncrement: true }
        );
        pesoStore.createIndex("ejercicioId", "ejercicioId", { unique: false });
        pesoStore.createIndex("semana", "semana", { unique: false });
        pesoStore.createIndex("fecha", "fecha", { unique: false });
        console.log("✅ Store 'historialPesos' creado");
      }

      // Store 3: Entrenamientos (logs)
      if (!database.objectStoreNames.contains(CONFIG.STORES.ENTRENAMIENTOS)) {
        const entrenStore = database.createObjectStore(
          CONFIG.STORES.ENTRENAMIENTOS,
          { keyPath: "id", autoIncrement: true }
        );
        entrenStore.createIndex("fecha", "fecha", { unique: false });
        entrenStore.createIndex("diaId", "diaId", { unique: false });
        console.log("✅ Store 'entrenamientos' creado");
      }

      // Store 4: Configuración
      if (!database.objectStoreNames.contains(CONFIG.STORES.CONFIG)) {
        database.createObjectStore(CONFIG.STORES.CONFIG, { keyPath: "key" });
        console.log("✅ Store 'config' creado");
      }

      console.log("✅ Inicialización de IndexedDB completada");
    };

    // Evento: éxito
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("✅ Base de datos conectada:", CONFIG.DB_NAME);
      resolve(db);
    };

    // Evento: error
    request.onerror = (event) => {
      console.error("❌ Error al abrir IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Obtener la instancia de la BD
 * @returns {IDBDatabase}
 */
export function obtenerDB() {
  if (!db) {
    throw new Error(
      "Base de datos no inicializada. Llama a inicializarDB() primero."
    );
  }
  return db;
}

/**
 * Leer un documento de cualquier store
 * @param {string} storeName
 * @param {*} key
 * @returns {Promise<any>}
 */
export function leerDocumento(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Escribir un documento en cualquier store
 * @param {string} storeName
 * @param {*} data
 * @returns {Promise<*>}
 */
export function escribirDocumento(storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Buscar documentos por índice
 * @param {string} storeName
 * @param {string} indexName
 * @param {*} valor
 * @returns {Promise<any[]>}
 */
export function buscarPorIndice(storeName, indexName, valor) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(valor);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Obtener todos los documentos de un store
 * @param {string} storeName
 * @returns {Promise<any[]>}
 */
export function obtenerTodos(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Vaciar un store completamente
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export function vaciarStore(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Verificar integridad de la BD
 */
export async function verificarIntegridad() {
  try {
    const config = await leerDocumento(CONFIG.STORES.CONFIG, "horaInicio");
    if (!config) {
      console.log("⚠️ Base de datos vacía, necesita pre-cargarse");
      return false;
    }
    console.log("✅ Base de datos íntegra");
    return true;
  } catch (error) {
    console.error("❌ Error verificando BD:", error);
    return false;
  }
}
