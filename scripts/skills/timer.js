/**
 * ⏱️ SKILLS: TIMER
 *
 * Funciones para gestionar contadores de descanso
 * LAYER 3: Entrenamiento (Core)
 */

/**
 * SKILL: IniciarTimer
 * Inicia un timer visual que cuenta hacia atrás
 * @param {number} segundos - Duración del timer
 * @param {Function} onTick - Callback cada segundo
 * @param {Function} onComplete - Callback al completar
 * @returns {Object} - { pause, resume, stop, tiempoRestante }
 */
export function iniciarTimer(segundos, onTick = () => {}, onComplete = () => {}) {
  // TODO: Implementar en Layer 3
  console.log("⏱️ TODO: IniciarTimer en Layer 3");
  return {
    pause: () => console.log("pause"),
    resume: () => console.log("resume"),
    stop: () => console.log("stop"),
    tiempoRestante: segundos
  };
}

/**
 * SKILL: DetenerTimer
 */
export function detenerTimer(timerInstance) {
  // TODO: Implementar en Layer 3
  console.log("⏱️ TODO: DetenerTimer en Layer 3");
}
