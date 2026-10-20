/**
 * 🎨 COMPONENTES UI
 *
 * Componentes reutilizables para renderizar la app
 * LAYERS: 2-6
 */

/**
 * Crear botón estándar
 */
export function crearBoton(texto, clase = "") {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.className = `btn ${clase}`;
  return btn;
}

/**
 * Crear card para mostrar variación
 */
export function crearCardVariacion(variacionData) {
  // TODO: Implementar
  console.log("🎨 TODO: crearCardVariacion");
  const card = document.createElement("div");
  card.className = "card variacion";
  return card;
}

/**
 * Crear lista de ejercicios
 */
export function crearListaEjercicios(ejercicios) {
  // TODO: Implementar
  console.log("🎨 TODO: crearListaEjercicios");
  const lista = document.createElement("ul");
  lista.className = "lista-ejercicios";
  return lista;
}

/**
 * Crear botón de Google Sign-In
 */
export function crearBotongoogleSignIn() {
  const btn = document.createElement("div");
  btn.id = "google-signin-button";
  btn.className = "google-signin-btn";
  return btn;
}

/**
 * Mostrar estado de sincronización
 */
export function mostrarEstadoSincronizacion(estado) {
  // TODO: Implementar
  console.log("🎨 TODO: mostrarEstadoSincronizacion", estado);
}
