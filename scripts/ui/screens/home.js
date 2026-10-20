/**
 * 🏠 HOME SCREEN
 *
 * Muestra:
 * - Saludo personalizado con fecha
 * - Card de variación actual (semana + grupo muscular)
 * - Lista de ejercicios del día
 * - Botón "Comenzar Entrenamiento"
 */

export class HomeScreen {
  constructor(db) {
    this.db = db;
  }

  /**
   * Renderizar la pantalla HOME
   */
  async render(container) {
    try {
      // Obtener datos
      const variacionActual = await this.obtenerVariacionActual();
      const ejerciciosHoy = await this.obtenerEjerciciosHoy();
      const fecha = this.obtenerFechaFormato();

      // Crear HTML
      const html = `
        <div class="home-screen">
          <!-- Header con saludo y fecha -->
          <div class="home-header">
            <div class="date-label">${fecha}</div>
            <h1 class="greeting">¡Hola!</h1>
          </div>

          <!-- Card de variación actual -->
          <div class="variation-card">
            <h2>Variación Actual</h2>
            <div class="current">Semana ${variacionActual.semana}</div>
            <div class="variation-badge">${variacionActual.grupoMuscular} • ${variacionActual.dia}</div>
          </div>

          <!-- Sección de ejercicios -->
          <div class="exercise-section">
            <h3>Ejercicios Hoy</h3>
            <div class="exercise-list">
              ${ejerciciosHoy.map((ex, idx) => `
                <div class="exercise-item">
                  <div class="exercise-number">${idx + 1}</div>
                  <div class="exercise-info">
                    <div class="exercise-name">${ex.nombre}</div>
                    <div class="exercise-details">${ex.series} × ${ex.reps} reps • ${ex.descanso}s descanso</div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Botón CTA -->
          <button class="btn btn-primary btn-large" id="btn-start-workout">
            Comenzar Entrenamiento
          </button>
        </div>
      `;

      container.innerHTML = html;

      // Registrar event listeners
      this.registrarEventos(container);
    } catch (error) {
      console.error("❌ Error renderizando HOME:", error);
      container.innerHTML = `<div class="error">Error cargando pantalla. Intenta de nuevo.</div>`;
    }
  }

  /**
   * Obtener variación actual de IndexedDB
   */
  async obtenerVariacionActual() {
    try {
      // Obtener config de variación actual
      const configDoc = await this.db.obtenerDocumento("config", "variacionActual");

      if (!configDoc || !configDoc.value) {
        return {
          semana: 1,
          grupoMuscular: "Desconocido",
          dia: "Hoy"
        };
      }

      const variationData = configDoc.value;

      // Obtener los detalles de la variación para grupoMuscular y día
      // Las variaciones se indexan con [diaId, numeroVariacion]
      const variacion = await this.db.obtenerDocumento(
        "variaciones",
        [variationData.diaId, variationData.numeroVariacion]
      );

      return {
        semana: variationData.numeroSemana || 1,
        grupoMuscular: variacion?.grupoMuscular || "Desconocido",
        dia: variacion?.dia || "Hoy"
      };
    } catch (error) {
      console.warn("⚠️ No se pudo obtener variación:", error);
      return {
        semana: 1,
        grupoMuscular: "Desconocido",
        dia: "Hoy"
      };
    }
  }

  /**
   * Obtener ejercicios del día de hoy
   */
  async obtenerEjerciciosHoy() {
    try {
      const configDoc = await this.db.obtenerDocumento("config", "variacionActual");
      if (!configDoc || !configDoc.value) return [];

      const variationData = configDoc.value;

      // Los ejercicios ya vienen en el valor de configuración
      if (variationData.ejercicios && Array.isArray(variationData.ejercicios)) {
        return variationData.ejercicios;
      }

      // Fallback: obtener de la tienda de variaciones
      const variacion = await this.db.obtenerDocumento(
        "variaciones",
        [variationData.diaId, variationData.numeroVariacion]
      );
      return variacion?.ejercicios || [];
    } catch (error) {
      console.warn("⚠️ No se pudieron obtener ejercicios:", error);
      return [];
    }
  }

  /**
   * Obtener fecha en formato "Lunes, 6 de Oct"
   */
  obtenerFechaFormato() {
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const hoy = new Date();
    const diaSemana = diasSemana[hoy.getDay()];
    const dia = hoy.getDate();
    const mes = meses[hoy.getMonth()];

    return `${diaSemana}, ${dia} de ${mes}`;
  }

  /**
   * Registrar event listeners
   */
  registrarEventos(container) {
    const btnStart = container.querySelector("#btn-start-workout");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        // Disparar evento para navegar a WORKOUT
        window.dispatchEvent(new CustomEvent("navigate-to-tab", {
          detail: { tab: "workout" }
        }));
      });
    }
  }
}
