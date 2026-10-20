/**
 * 🗄️ DATABASE ADAPTER
 *
 * Wrapper para el IDBDatabase que proporciona métodos amigables
 * para que las pantallas de Layer 2 puedan acceder a los datos
 */

import {
  leerDocumento,
  escribirDocumento,
  obtenerTodos,
  vaciarStore,
  buscarPorIndice
} from "./db.js";

export class DatabaseAdapter {
  constructor(idbInstance) {
    this.idb = idbInstance;
  }

  /**
   * Obtener un documento por clave
   * @param {string} storeName - Nombre del store
   * @param {*} key - Clave del documento
   * @returns {Promise<any>}
   */
  async obtenerDocumento(storeName, key) {
    try {
      return await leerDocumento(storeName, key);
    } catch (error) {
      console.warn(`⚠️ Error obteniendo documento de ${storeName}:`, error);
      return null;
    }
  }

  /**
   * Obtener todos los documentos de un store
   * @param {string} storeName - Nombre del store
   * @returns {Promise<any[]>}
   */
  async obtenerTodos(storeName) {
    try {
      return await obtenerTodos(storeName);
    } catch (error) {
      console.warn(`⚠️ Error obteniendo todos de ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Escribir un documento en un store
   * @param {string} storeName - Nombre del store
   * @param {any} data - Datos a escribir
   * @returns {Promise<void>}
   */
  async escribirDocumento(storeName, data) {
    try {
      return await escribirDocumento(storeName, data);
    } catch (error) {
      console.error(`❌ Error escribiendo en ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Vaciar un store completamente
   * @param {string} storeName - Nombre del store
   * @returns {Promise<void>}
   */
  async vaciarStore(storeName) {
    try {
      return await vaciarStore(storeName);
    } catch (error) {
      console.error(`❌ Error vaciando ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Buscar documentos por índice
   * @param {string} storeName - Nombre del store
   * @param {string} indexName - Nombre del índice
   * @param {*} valor - Valor a buscar
   * @returns {Promise<any[]>}
   */
  async buscarPorIndice(storeName, indexName, valor) {
    try {
      return await buscarPorIndice(storeName, indexName, valor);
    } catch (error) {
      console.warn(`⚠️ Error buscando en ${storeName}:`, error);
      return [];
    }
  }
}
