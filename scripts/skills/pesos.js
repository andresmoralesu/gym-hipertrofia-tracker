/**
 * ⚖️ SKILLS: PESOS
 *
 * Funciones para guardar y obtener historial de pesos
 * LAYER 3: Entrenamiento (Core)
 */

import { CONFIG } from "../config.js";

/**
 * SKILL: GuardarPesoEjercicio
 * Guarda el peso usado en un ejercicio
 * @param {Object} dato - { ejercicioId, peso, semana, series, reps, fecha }
 * @returns {Promise<{guardado: boolean}>}
 */
export async function guardarPesoEjercicio(dato) {
  // TODO: Implementar en Layer 3
  console.log("⚖️ TODO: GuardarPesoEjercicio en Layer 3", dato);
  return { guardado: false };
}

/**
 * SKILL: ObtenerHistorialPesos
 * Obtiene el historial de pesos de un ejercicio
 * @param {string} ejercicioId
 * @returns {Promise<Array>}
 */
export async function obtenerHistorialPesos(ejercicioId) {
  // TODO: Implementar en Layer 4
  console.log("⚖️ TODO: ObtenerHistorialPesos en Layer 4", ejercicioId);
  return [];
}

/**
 * SKILL: ObtenerPesoPromedio
 * Calcula el peso promedio de un ejercicio
 * @param {string} ejercicioId
 * @returns {Promise<number>}
 */
export async function obtenerPesoPromedio(ejercicioId) {
  // TODO: Implementar en Layer 4
  console.log("⚖️ TODO: ObtenerPesoPromedio en Layer 4", ejercicioId);
  return 0;
}
