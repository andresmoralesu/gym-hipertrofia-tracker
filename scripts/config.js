/**
 * 📋 CONFIGURACIÓN GLOBAL
 *
 * IMPORTANTE:
 * - Crear .env.example y .env.local (NO COMMITEAR)
 * - Obtener GOOGLE_CLIENT_ID de Google Cloud Console
 */

export const CONFIG = {
  // Google OAuth 2.0
  // TODO: Reemplazar con tu Client ID de https://console.cloud.google.com/
  GOOGLE_CLIENT_ID: "", // "tu-client-id-aqui.apps.googleusercontent.com"

  // IndexedDB
  DB_NAME: "GymTracker",
  DB_VERSION: 1,

  // Sincronización con Google Drive
  SYNC_INTERVAL_MS: 300000, // 5 minutos
  MAX_SYNC_RETRIES: 3,

  // Configuración de entrenamiento
  TRAINING_START: "05:00", // Hora de inicio
  TRAINING_DURATION_MIN: 90, // Minutos
  VARIATION_CYCLE_LENGTH: 5, // Número de variaciones en el ciclo

  // Inicio del programa: el LUNES de la semana 1 (formato AAAA-MM-DD, hora local).
  // La semana N va de lunes a domingo, N = semanas completas desde esta fecha + 1,
  // y la variación es ((N-1) % 5) + 1. Antes de esta fecha se muestra la semana 1.
  FECHA_INICIO_PROGRAMA: "2026-10-26",

  // Stores de IndexedDB
  STORES: {
    VARIACIONES: "variaciones",
    HISTORIAL_PESOS: "historialPesos",
    ENTRENAMIENTOS: "entrenamientos",
    CONFIG: "config"
  }
};

/**
 * Validar que el Client ID esté configurado
 */
export function validarConfiguracion() {
  if (!CONFIG.GOOGLE_CLIENT_ID) {
    console.warn(
      "⚠️ GOOGLE_CLIENT_ID no configurado. " +
      "Sincronización con Google Drive no funcionará. " +
      "Ve a https://console.cloud.google.com/ para crear uno."
    );
    return false;
  }
  return true;
}
