/**
 * 🎯 SKILLS: VARIACIONES SEMANALES
 *
 * Funciones puras para:
 * 1. Calcular número de semana ISO
 * 2. Mapear semana a variación (con ciclo)
 * 3. Obtener variación de la BD
 * 4. Detectar cambios vs semana anterior
 */

import { CONFIG } from "../config.js";
import { leerDocumento, obtenerTodos, buscarPorIndice } from "../db.js";

/**
 * SKILL: CalcularNumeroDeSemana
 *
 * Calcula el número de semana ISO (1-52) basado en la fecha
 * Usa ISO 8601: La semana 1 es la primera con jueves en enero
 *
 * @param {Date} fecha - Fecha a calcular (default: hoy)
 * @returns {number} - Número de semana (1-52)
 */
export function calcularNumeroDeSemana(fecha = new Date()) {
  // Crear una copia (en UTC) para no mutar la original
  const d = new Date(
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  );

  // ISO 8601: el día de la semana va de 1 (lunes) a 7 (domingo)
  const diaSemana = d.getUTCDay() || 7;

  // Mover la fecha al jueves de esa semana (el jueves define a qué año pertenece)
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);

  // Semana = cuántas semanas completas hay desde el 1 de enero de ese año
  const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7);

  return Math.max(1, Math.min(52, weekNum)); // Clamp entre 1-52 (semana 53 cuenta como 52)
}

/**
 * SKILL: MapearVariacionDeSemana
 *
 * Mapea un número de semana (1-52) a número de variación (1-5 en ciclo)
 * Ejemplo con VARIATION_CYCLE_LENGTH=5:
 * - Semana 1 → Variación 1
 * - Semana 2 → Variación 2
 * - Semana 5 → Variación 5
 * - Semana 6 → Variación 1 (reinicia ciclo)
 *
 * @param {number} numeroSemana - 1-52
 * @returns {number} - Número de variación (1-5)
 */
export function mapearVariacionDeSemana(numeroSemana) {
  if (numeroSemana < 1 || numeroSemana > 52) {
    throw new Error(`Número de semana inválido: ${numeroSemana}`);
  }

  const cycleLength = CONFIG.VARIATION_CYCLE_LENGTH;
  // Usar módulo para ciclar: semana 6 → variación 1
  const variacionNumero = ((numeroSemana - 1) % cycleLength) + 1;

  return variacionNumero;
}

/**
 * SKILL: ObtenerVariacionDeBD
 *
 * Obtiene los ejercicios de una variación específica desde IndexedDB
 *
 * @param {string} diaId - "martes", "miercoles", "viernes"
 * @param {number} numeroVariacion - 1-5
 * @returns {Promise<Object|null>} - Datos de la variación o null si no existe
 */
export async function obtenerVariacionDeBD(diaId, numeroVariacion) {
  try {
    const variacion = await leerDocumento(
      CONFIG.STORES.VARIACIONES,
      [diaId, numeroVariacion]
    );
    return variacion || null;
  } catch (error) {
    console.error(
      `Error obteniendo variación ${diaId} #${numeroVariacion}:`,
      error
    );
    return null;
  }
}

/**
 * SKILL: ObtenerVariacionActual
 *
 * Calcula y obtiene la variación actual para un día específico
 *
 * @param {string} diaId - "martes", "miercoles", "viernes"
 * @param {Date} fecha - Fecha de referencia (default: hoy)
 * @returns {Promise<Object>} - {
 *   numeroSemana: number,
 *   numeroVariacion: number,
 *   diaId: string,
 *   variacionData: Object (ejercicios, series, reps, etc.)
 * }
 */
export async function obtenerVariacionActual(diaId, fecha = new Date()) {
  try {
    // Paso 1: Calcular semana
    const numeroSemana = calcularNumeroDeSemana(fecha);

    // Paso 2: Mapear a número de variación
    const numeroVariacion = mapearVariacionDeSemana(numeroSemana);

    // Paso 3: Obtener variación de BD
    const variacionData = await obtenerVariacionDeBD(diaId, numeroVariacion);

    if (!variacionData) {
      console.warn(
        `Variación no encontrada: ${diaId} #${numeroVariacion}`
      );
      return {
        numeroSemana,
        numeroVariacion,
        diaId,
        variacionData: null,
        error: "Variación no pre-cargada"
      };
    }

    return {
      numeroSemana,
      numeroVariacion,
      diaId,
      variacionData
    };
  } catch (error) {
    console.error("Error en obtenerVariacionActual:", error);
    throw error;
  }
}

/**
 * SKILL: ObtenerVariacionAnterior
 *
 * Obtiene la variación de la semana anterior (para comparar cambios)
 *
 * @param {string} diaId - "martes", "miercoles", "viernes"
 * @param {Date} fecha - Fecha de referencia
 * @returns {Promise<Object>} - Variación anterior
 */
export async function obtenerVariacionAnterior(diaId, fecha = new Date()) {
  // Restar 7 días para la semana anterior
  const semanaAnterior = new Date(fecha.getTime() - 7 * 24 * 60 * 60 * 1000);
  return obtenerVariacionActual(diaId, semanaAnterior);
}

/**
 * SKILL: CompararVariaciones
 *
 * Compara dos variaciones y detecta qué cambió
 *
 * @param {Object} variacionActual
 * @param {Object} variacionAnterior
 * @returns {Object} - { ejerciciosNuevos: [], ejerciciosEliminados: [], cambios: [] }
 */
export function compararVariaciones(variacionActual, variacionAnterior) {
  const ejerciciosActuales = new Set(
    variacionActual.variacionData?.ejercicios?.map(e => e.id) || []
  );
  const ejerciciosAnteriores = new Set(
    variacionAnterior.variacionData?.ejercicios?.map(e => e.id) || []
  );

  const ejerciciosNuevos = [...ejerciciosActuales].filter(
    e => !ejerciciosAnteriores.has(e)
  );
  const ejerciciosEliminados = [...ejerciciosAnteriores].filter(
    e => !ejerciciosActuales.has(e)
  );

  return {
    ejerciciosNuevos,
    ejerciciosEliminados,
    sonIguales: ejerciciosNuevos.length === 0 && ejerciciosEliminados.length === 0
  };
}

/**
 * SKILL: ObtenerProximoDia
 *
 * Calcula el próximo día de entrenamiento desde hoy
 * Orden: Martes, Miércoles, Viernes
 *
 * @param {Date} fecha - Fecha de referencia (default: hoy)
 * @returns {Object} - { diaId: string, diasAlProximo: number, fecha: Date }
 */
export function obtenerProximoDia(fecha = new Date()) {
  const diasEntrenamiento = ["martes", "miercoles", "viernes"];

  // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  const diaHoyNumerico = fecha.getDay();
  const mapaDias = { martes: 2, miercoles: 3, viernes: 5 };

  // Buscar próximo día de entrenamiento
  let proximoDia = null;
  let diasAlProximo = 0;

  for (let i = 1; i <= 7; i++) {
    const proximaFecha = new Date(fecha);
    proximaFecha.setDate(proximaFecha.getDate() + i);
    const dioDiaProximo = proximaFecha.getDay();

    const diaIdProximo = Object.keys(mapaDias).find(
      dia => mapaDias[dia] === dioDiaProximo
    );

    if (diaIdProximo) {
      proximoDia = diaIdProximo;
      diasAlProximo = i;
      break;
    }
  }

  // Si no encontramos en esta semana, será el martes de la próxima
  if (!proximoDia) {
    proximoDia = "martes";
    diasAlProximo = 7 - diaHoyNumerico + 2;
  }

  const fechaProxima = new Date(fecha);
  fechaProxima.setDate(fechaProxima.getDate() + diasAlProximo);

  return {
    diaId: proximoDia,
    diasAlProximo,
    fecha: fechaProxima
  };
}

/**
 * SKILL: EsHoyEntrenamiento
 *
 * Verifica si hoy es día de entrenamiento
 *
 * @param {Date} fecha - Fecha de referencia
 * @returns {string|null} - diaId si es día de entrenamiento, null si no
 */
export function esHoyEntrenamiento(fecha = new Date()) {
  const diasEntrenamiento = {
    2: "martes",
    3: "miercoles",
    5: "viernes"
  };

  const diaNumerico = fecha.getDay();
  return diasEntrenamiento[diaNumerico] || null;
}