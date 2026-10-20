/**
 * 🤖 CLAUDE VARIATION SERVICE
 *
 * Genera variaciones de ejercicios usando Claude API
 * a través de Google Apps Script.
 *
 * Usa JSONP (etiqueta <script>) porque Apps Script no permite
 * enviar headers CORS, y los <script> no están sujetos a CORS.
 */

export class ClaudeVariacionService {
  constructor() {
    // La API key de Claude vive en las Script Properties de Apps Script
    // (CLAUDE_API_KEY); la app nunca la maneja.
    // URL del deploy de Apps Script (la misma que main.js)
    this.scriptUrl = "https://script.google.com/macros/s/AKfycbw52M-0YrNNiNYvnikCayWVgdjudyVy0v7aQejgoIbQBRO67rKrkC9KJRC1S3ixp2QB/exec";
    this.timeoutMs = 120000; // Claude puede tardar 30-60s
  }

  /**
   * Generar los ejercicios de la semana siguiente para un día de entrenamiento
   * @param {Object} opciones
   * @param {string} opciones.foco - Enfoque del día ("Pierna", "Pecho/Tríceps/Hombro", "Espalda/Bíceps")
   * @param {Array} opciones.ejerciciosActuales - Ejercicios de esta semana (se evita repetirlos)
   * @param {number} opciones.semanaActual - Número de semana
   * @returns {Promise<Array>} Lista de ejercicios nuevos
   */
  generarVariacionesSemana({ foco, ejerciciosActuales, semanaActual }) {
    return new Promise((resolve, reject) => {
      console.log("🤖 Generando variaciones con Claude AI...");

      if (!this.scriptUrl) {
        reject(new Error("Google Apps Script URL no configurada"));
        return;
      }

      const callbackName = `claudeCb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      const params = new URLSearchParams({
        action: "generarVariacionesConClaude",
        foco: foco,
        ejerciciosJSON: JSON.stringify(
          ejerciciosActuales.map(e => ({
            nombre: e.nombre,
            series: e.series,
            reps: e.reps,
            equipo: e.equipo
          }))
        ),
        semanaActual: String(semanaActual),
        callback: callbackName
      });

      const script = document.createElement("script");

      const cleanup = () => {
        clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Tiempo de espera agotado. Claude tardó demasiado, intenta de nuevo."));
      }, this.timeoutMs);

      // Apps Script llamará a esta función con la respuesta
      window[callbackName] = (data) => {
        cleanup();
        if (data && data.success) {
          console.log("✅ Variaciones generadas exitosamente");
          resolve(data.ejercicios);
        } else {
          reject(new Error((data && data.error) || "Error desconocido en generación de variaciones"));
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("No se pudo conectar con Google Apps Script. Revisa la URL del deploy."));
      };

      script.src = `${this.scriptUrl}?${params.toString()}`;
      document.head.appendChild(script);
    });
  }
}