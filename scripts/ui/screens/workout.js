/**
 * 💪 WORKOUT SCREEN
 *
 * Muestra:
 * - Timer de descanso
 * - Ejercicio actual + serie
 * - Input para peso levantado
 * - Botones de acción (Serie OK / Saltar)
 * - Próximo ejercicio
 */

import { describirRutina } from "../rutinaDia.js";

export class WorkoutScreen {
  constructor(db) {
    this.db = db;
    this.timerInterval = null;
    this.tiempoRestante = 0;
    this.container = null; // Guardar referencia del contenedor
  }

  /**
   * Renderizar la pantalla WORKOUT
   */
  async render(container) {
    try {
      // Guardar referencia del contenedor para re-renderizaciones
      this.container = container;

      // Obtener datos
      const variacionActual = await this.obtenerVariacionActual();
      const estado = await this.obtenerEstadoEntrenamiento();

      // Crear HTML
      const html = `
        <div class="workout-screen">
          <!-- Header con día y grupo muscular -->
          <div class="workout-header">
            <div class="title">Entrenamiento Activo</div>
            <div class="day">${variacionActual.dia} • ${variacionActual.grupoMuscular}</div>
          </div>

          <!-- Timer de descanso -->
          <div class="timer-display">
            <div class="timer-label">Descanso</div>
            <div class="timer-value" id="timer">00:45</div>
          </div>

          <!-- Ejercicio actual -->
          <div class="current-exercise">
            <label>Ejercicio Actual</label>
            <div class="exercise-name">${estado.ejercicioActual.nombre}</div>
          </div>

          <!-- Contador de series -->
          <div class="set-counter">
            <label>Serie</label>
            <div class="number" id="set-counter">${estado.serieActual} / ${estado.totalSeries}</div>
          </div>

          <!-- Input de peso -->
          <input type="number"
                 class="weight-input"
                 id="weight-input"
                 placeholder="Peso levantado (kg)"
                 step="0.5">

          <!-- Input de notas -->
          <input type="text"
                 class="notes-input"
                 id="notes-input"
                 placeholder="Notas (opcional)">

          <!-- Botones de acción -->
          <div class="action-buttons">
            <button class="btn btn-success" id="btn-set-ok">✓ Serie OK</button>
            <button class="btn btn-secondary" id="btn-skip">Saltar</button>
          </div>

          <!-- Próximo ejercicio -->
          <div class="current-exercise">
            <label>Próximo Ejercicio</label>
            <div class="exercise-name">${estado.proximoEjercicio?.nombre || "—"}</div>
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Registrar event listeners
      this.registrarEventos(container, estado);

      // Iniciar timer
      this.iniciarTimer(container, estado.ejercicioActual.descanso);
    } catch (error) {
      console.error("❌ Error renderizando WORKOUT:", error);
      container.innerHTML = `<div class="error">Error cargando pantalla. Intenta de nuevo.</div>`;
    }
  }

  /**
   * Obtener variación actual
   */
  async obtenerVariacionActual() {
    try {
      const configDoc = await this.db.obtenerDocumento("config", "variacionActual");
      if (!configDoc || !configDoc.value) {
        return { dia: "Hoy", grupoMuscular: "Desconocido" };
      }

      const variationData = configDoc.value;
      const variacion = await this.db.obtenerDocumento(
        "variaciones",
        [variationData.diaId, variationData.numeroVariacion]
      );

      return describirRutina(variationData.diaId, variacion);
    } catch (error) {
      return { dia: "Hoy", grupoMuscular: "Desconocido" };
    }
  }

  /**
   * Obtener estado actual del entrenamiento
   */
  async obtenerEstadoEntrenamiento() {
    try {
      const estado = await this.db.obtenerDocumento("entrenamientos", "actual");

      // El avance guardado solo vale el mismo día; otro día se empieza de cero
      if (!estado || estado.fechaEntreno !== this.fechaHoy()) {
        // Crear estado inicial si no existe
        const configDoc = await this.db.obtenerDocumento("config", "variacionActual");
        if (!configDoc || !configDoc.value) {
          return {
            ejercicioActual: { nombre: "—", descanso: 60, series: 5, reps: 8 },
            serieActual: 1,
            totalSeries: 5,
            proximoEjercicio: null
          };
        }

        const variationData = configDoc.value;
        const ejercicios = variationData.ejercicios || [];

        return {
          ejercicioActual: ejercicios[0] || { nombre: "—", descanso: 60, series: 5, reps: 8 },
          serieActual: 1,
          totalSeries: ejercicios[0]?.series || 5,
          proximoEjercicio: ejercicios[1] || null
        };
      }

      return estado;
    } catch (error) {
      return {
        ejercicioActual: { nombre: "—", descanso: 60, series: 5, reps: 8 },
        serieActual: 1,
        totalSeries: 5,
        proximoEjercicio: null
      };
    }
  }

  /**
   * Iniciar timer de descanso
   */
  iniciarTimer(container, segundosTotales) {
    const timerDisplay = container.querySelector("#timer");
    this.tiempoRestante = segundosTotales;

    // Mostrar tiempo inicial
    this.actualizarDisplayTimer(timerDisplay);

    // Limpiar timer anterior si existe
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Iniciar countdown
    this.timerInterval = setInterval(() => {
      this.tiempoRestante--;

      this.actualizarDisplayTimer(timerDisplay);

      // Sonar alarma cuando termine
      if (this.tiempoRestante <= 0) {
        clearInterval(this.timerInterval);
        this.reproducirAlarma();
      }
    }, 1000);
  }

  /**
   * Actualizar display del timer
   */
  actualizarDisplayTimer(display) {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    display.textContent = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  /**
   * Reproducir alarma (placeholder)
   */
  reproducirAlarma() {
    // Usar API de Audio del navegador o notificación visual
    console.log("🔔 ¡Tiempo de descanso terminado!");
  }

  /**
   * Registrar event listeners
   */
  registrarEventos(container, estado) {
    const btnSetOk = container.querySelector("#btn-set-ok");
    const btnSkip = container.querySelector("#btn-skip");
    const inputPeso = container.querySelector("#weight-input");
    const inputNotas = container.querySelector("#notes-input");

    btnSetOk?.addEventListener("click", () => this.completarSerie(inputPeso, inputNotas, estado));
    btnSkip?.addEventListener("click", () => this.saltarSerie(estado));
  }

  /**
   * Completar una serie
   */
  async completarSerie(inputPeso, inputNotas, estado) {
    const peso = parseFloat(inputPeso?.value);

    if (isNaN(peso) || peso <= 0) {
      alert("Por favor ingresa un peso válido");
      return;
    }

    try {
      // Guardar en historialPesos
      const registro = {
        id: `${estado.ejercicioActual.nombre}-${Date.now()}`,
        ejercicio: estado.ejercicioActual.nombre,
        peso: peso,
        fecha: new Date().toISOString(),
        series: estado.totalSeries,
        reps: estado.ejercicioActual.reps || 0,
        notas: inputNotas?.value || ""
      };

      await this.db.escribirDocumento("historialPesos", registro);

      console.log(`✅ Serie ${estado.serieActual} completada con ${peso}kg`);

      // Limpiar inputs
      inputPeso.value = "";
      inputNotas.value = "";

      // Avanzar a próxima serie o ejercicio
      if (estado.serieActual < estado.totalSeries) {
        estado.serieActual++;
        // Guardar el avance ANTES de mostrarlo: si se recarga justo después, no se pierde la serie
        await this.persistirEstado(estado);
        this.actualizarContadorSerie(estado);
        // Reiniciar timer de descanso
        this.iniciarTimer(document.querySelector(".workout-screen"), estado.ejercicioActual.descanso);
      } else {
        // Mostrar modal de ejercicio completado
        this.mostrarModalEjercicioCompletado(estado);
      }
    } catch (error) {
      console.error("❌ Error guardando serie:", error);
      alert("Error al guardar la serie");
    }
  }

  /**
   * Fecha de hoy (YYYY-MM-DD, hora local)
   */
  fechaHoy() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  /**
   * Actualizar en pantalla el contador "Serie 1 / 3"
   */
  actualizarContadorSerie(estado) {
    const contador = document.querySelector("#set-counter");
    if (contador) {
      contador.textContent = `${estado.serieActual} / ${estado.totalSeries}`;
    }
  }

  /**
   * Guardar el avance (ejercicio y serie actual) para que no se pierda
   * al cambiar de pestaña o recargar la app
   */
  async persistirEstado(estado) {
    try {
      await this.db.escribirDocumento("entrenamientos", {
        ...estado,
        id: "actual",
        fechaEntreno: this.fechaHoy()
      });
    } catch (error) {
      console.warn("⚠️ No se pudo guardar el avance del entrenamiento:", error);
    }
  }

  /**
   * Mostrar modal cuando se completa un ejercicio
   */
  mostrarModalEjercicioCompletado(estado) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="btn-close-modal">✕</button>
        <h2>✓ ¡Ejercicio Completado!</h2>
        <p>${estado.ejercicioActual.nombre}</p>
        <div class="modal-buttons">
          <button class="btn btn-success" id="btn-next-exercise">Siguiente Ejercicio</button>
          <button class="btn btn-secondary" id="btn-home">Volver a Home</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector("#btn-close-modal").addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector("#btn-next-exercise").addEventListener("click", () => {
      modal.remove();
      this.avanzarAlSiguienteEjercicio(estado);
    });

    modal.querySelector("#btn-home").addEventListener("click", () => {
      modal.remove();
      // El router no escucha location.hash: se navega con el mismo evento que usa "Comenzar Entrenamiento"
      window.dispatchEvent(new CustomEvent("navigate-to-tab", {
        detail: { tab: "home" }
      }));
    });
  }

  /**
   * Avanzar al siguiente ejercicio
   */
  async avanzarAlSiguienteEjercicio(estado) {
    try {
      // Obtener la lista completa de ejercicios
      const configDoc = await this.db.obtenerDocumento("config", "variacionActual");
      if (!configDoc || !configDoc.value) {
        alert("Error: No se encontró la configuración de entrenamiento");
        return;
      }

      const ejercicios = configDoc.value.ejercicios || [];

      // Encontrar índice del ejercicio actual
      const indiceActual = ejercicios.findIndex(ex => ex.nombre === estado.ejercicioActual.nombre);
      const siguienteIndice = indiceActual + 1;

      if (siguienteIndice < ejercicios.length) {
        // Hay siguiente ejercicio
        const siguienteEjercicio = ejercicios[siguienteIndice];
        const proximoProximo = ejercicios[siguienteIndice + 1] || null;

        const nuevoEstado = {
          id: "actual",  // IndexedDB necesita una clave primaria
          fechaEntreno: this.fechaHoy(),
          ejercicioActual: siguienteEjercicio,
          serieActual: 1,
          totalSeries: siguienteEjercicio.series || 3,
          proximoEjercicio: proximoProximo
        };

        // Guardar en IndexedDB
        await this.db.escribirDocumento("entrenamientos", nuevoEstado);

        // Re-renderizar usando la referencia del contenedor guardada
        if (this.container) {
          this.render(this.container);
        }
      } else {
        // No hay más ejercicios: entrenamiento completado
        alert("¡Entrenamiento completado! 🎉");
        window.location.hash = "#home";
      }
    } catch (error) {
      console.error("❌ Error avanzando a siguiente ejercicio:", error);
      alert("Error al avanzar al siguiente ejercicio");
    }
  }

  /**
   * Saltar una serie
   */
  async saltarSerie(estado) {
    if (confirm("¿Estás seguro de que quieres saltar esta serie?")) {
      if (estado.serieActual < estado.totalSeries) {
        estado.serieActual++;
        console.log(`⏭️ Serie saltada. Siguiente: ${estado.serieActual}`);
        await this.persistirEstado(estado);
        this.actualizarContadorSerie(estado);
        this.iniciarTimer(document.querySelector(".workout-screen"), estado.ejercicioActual.descanso);
      } else {
        this.mostrarModalEjercicioCompletado(estado);
      }
    }
  }
}
