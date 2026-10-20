/**
 * 📊 HISTORY SCREEN
 *
 * Muestra:
 * - Filtro de ejercicios (dropdown)
 * - Stats: máximo y promedio de peso
 * - Tabla con historial de progresión
 */

export class HistoryScreen {
  constructor(db) {
    this.db = db;
    this.ejercicioSeleccionado = null;
  }

  /**
   * Renderizar la pantalla HISTORY
   */
  async render(container) {
    try {
      // Obtener datos
      const ejercicios = await this.obtenerEjerciciosUnicos();

      // Usar el ejercicio seleccionado, o por defecto el primero
      const ejercicioSeleccionado = this.ejercicioSeleccionado || ejercicios[0]?.nombre || null;

      const stats = await this.calcularStats(ejercicioSeleccionado);
      const historial = await this.obtenerHistorial(ejercicioSeleccionado);

      // Crear HTML
      const html = `
        <div class="history-screen">
          <!-- Filtro de ejercicio -->
          <div class="filter-section">
            <label>Ejercicio</label>
            <select class="filter-select" id="exercise-filter">
              ${ejercicios.map(ex => `
                <option value="${ex.nombre}" ${ex.nombre === ejercicioSeleccionado ? "selected" : ""}>
                  ${ex.nombre}
                </option>
              `).join("")}
            </select>
          </div>

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-label">Máximo</div>
              <div class="stat-value">${stats.maximo || "—"} kg</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Promedio</div>
              <div class="stat-value">${stats.promedio || "—"} kg</div>
            </div>
          </div>

          <!-- Tabla de historial -->
          <div class="history-table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Series</th>
                  <th>Peso</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                ${historial.map(h => `
                  <tr>
                    <td>${this.formatearFecha(h.fecha)}</td>
                    <td>${h.series}</td>
                    <td><span class="number">${h.peso} kg</span></td>
                    <td class="notes-cell">${h.notas && h.notas.trim() ? h.notas : ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Registrar event listeners
      this.registrarEventos(container);
    } catch (error) {
      console.error("❌ Error renderizando HISTORY:", error);
      container.innerHTML = `<div class="error">Error cargando pantalla. Intenta de nuevo.</div>`;
    }
  }

  /**
   * Obtener lista única de ejercicios
   */
  async obtenerEjerciciosUnicos() {
    try {
      const historial = await this.db.obtenerTodos("historialPesos");
      const ejerciciosMap = new Map();

      historial.forEach(h => {
        if (!ejerciciosMap.has(h.ejercicio)) {
          ejerciciosMap.set(h.ejercicio, {
            nombre: h.ejercicio,
            registros: 0
          });
        }
        ejerciciosMap.get(h.ejercicio).registros++;
      });

      return Array.from(ejerciciosMap.values()).sort((a, b) =>
        b.registros - a.registros // Ordenar por más registros
      );
    } catch (error) {
      console.warn("⚠️ Error obteniendo ejercicios:", error);
      return [];
    }
  }

  /**
   * Calcular estadísticas (máximo y promedio)
   */
  async calcularStats(ejercicio) {
    if (!ejercicio) return { maximo: null, promedio: null };

    try {
      const historial = await this.db.obtenerTodos("historialPesos");
      const registros = historial.filter(h => h.ejercicio === ejercicio);

      if (registros.length === 0) return { maximo: null, promedio: null };

      const pesos = registros.map(r => r.peso);
      const maximo = Math.max(...pesos);
      const promedio = (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1);

      return { maximo, promedio };
    } catch (error) {
      console.warn("⚠️ Error calculando stats:", error);
      return { maximo: null, promedio: null };
    }
  }

  /**
   * Obtener historial ordenado por fecha
   */
  async obtenerHistorial(ejercicio) {
    if (!ejercicio) return [];

    try {
      const historial = await this.db.obtenerTodos("historialPesos");
      return historial
        .filter(h => h.ejercicio === ejercicio)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 20); // Últimos 20 registros
    } catch (error) {
      console.warn("⚠️ Error obteniendo historial:", error);
      return [];
    }
  }

  /**
   * Formatear fecha a "DD Mon"
   */
  formatearFecha(isoDate) {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const date = new Date(isoDate);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = meses[date.getMonth()];
    return `${dia} ${mes}`;
  }

  /**
   * Registrar event listeners
   */
  registrarEventos(container) {
    const selectEjercicio = container.querySelector("#exercise-filter");

    selectEjercicio?.addEventListener("change", async (e) => {
      this.ejercicioSeleccionado = e.target.value;
      // Re-renderizar con nuevo ejercicio
      await this.render(container);
    });
  }
}