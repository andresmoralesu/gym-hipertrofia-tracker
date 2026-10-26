/**
 * Rutina de cada día de entrenamiento (nombre del día + grupo muscular).
 *
 * Las variaciones guardadas en IndexedDB (las precargadas y las generadas con IA) no traen
 * los campos `dia` ni `grupoMuscular`, así que se derivan del `diaId` con el que se indexan.
 * Si una variación sí trae esos campos, se respetan.
 */
export const RUTINA_POR_DIA = {
  martes:    { dia: "Martes",    grupoMuscular: "Pierna" },
  miercoles: { dia: "Miércoles", grupoMuscular: "Pecho/Tríceps/Hombro" },
  viernes:   { dia: "Viernes",   grupoMuscular: "Espalda/Bíceps" }
};

/**
 * @param {string} diaId - "martes" | "miercoles" | "viernes"
 * @param {Object} [variacion] - documento de la variación (opcional)
 * @returns {{dia: string, grupoMuscular: string}}
 */
export function describirRutina(diaId, variacion) {
  const base = RUTINA_POR_DIA[diaId] || { dia: "Hoy", grupoMuscular: "Desconocido" };
  return {
    dia: variacion?.dia || base.dia,
    grupoMuscular: variacion?.grupoMuscular || base.grupoMuscular
  };
}
