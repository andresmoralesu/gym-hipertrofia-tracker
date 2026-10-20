/**
 * 🖥️ RENDERER
 *
 * Funciones para renderizar la UI
 * LAYERS: 2-6
 */

/**
 * Renderizar página principal
 */
export function renderizarPaginaPrincipal(variacionActual) {
  // TODO: Implementar en Layer 2
  console.log("🖥️ TODO: renderizarPaginaPrincipal en Layer 2");
}

/**
 * Renderizar pantalla de entrenamiento
 */
export function renderizarEntrenamiento(ejercicio, serieActual, totalSeries) {
  // TODO: Implementar en Layer 3
  console.log("🖥️ TODO: renderizarEntrenamiento en Layer 3");
}

/**
 * Renderizar historial
 */
export function renderizarHistorial(historial) {
  // TODO: Implementar en Layer 4
  console.log("🖥️ TODO: renderizarHistorial en Layer 4");
}

/**
 * Actualizar estado de sincronización
 */
export function actualizarEstadoSincronizacion(conectado, ultimaSincronizacion) {
  // TODO: Implementar en Layer 5
  console.log("🖥️ TODO: actualizarEstadoSincronizacion en Layer 5");
}

/**
 * Mostrar notificación
 */
export function mostrarNotificacion(mensaje, tipo = "info") {
  console.log(`📢 [${tipo.toUpperCase()}] ${mensaje}`);
}

/**
 * Limpiar pantalla
 */
export function limpiarPantalla() {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = "";
  }
}
