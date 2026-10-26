/**
 * ⚙️ SETTINGS SCREEN
 *
 * Muestra:
 * - Estado de sincronización con Google Sheets
 * - Botón de Google Sign-In
 * - Botón manual de sincronización
 * - Botón de restauración de datos
 * - Info de versión
 * - Toggle de dark mode
 * - Botón de clear data
 * - Botón de generar variaciones con IA
 */

export class SettingsScreen {
  constructor(db) {
    this.db = db;
  }

  /**
   * Renderizar la pantalla SETTINGS
   */
  async render(container) {
    try {
      const estadoSync = await this.obtenerEstadoSincronizacion();

      const html = `
        <div class="settings-screen">
          <!-- SECCIÓN: Sincronización -->
          <div class="settings-section">
            <h3>Sincronización</h3>

            <button class="google-btn ${estadoSync.conectado ? "connected" : ""}" id="btn-google-signin">
              ${estadoSync.conectado ? "✓ Conectado a Google" : "Conectar con Google"}
            </button>

            <div class="settings-item">
              <label>Estado</label>
              <span class="status-badge ${estadoSync.enLinea ? "online" : "offline"}">
                ${estadoSync.enLinea ? "EN LÍNEA" : "DESCONECTADO"}
              </span>
            </div>

            <div class="settings-item">
              <label>Última sincronización</label>
              <div class="value">${estadoSync.ultimaSync}</div>
            </div>

            <button class="btn btn-secondary" id="btn-sync-now" style="width: 100%; margin-top: 8px;">
              ✓ Sincronizar Ahora
            </button>

            <button class="btn btn-secondary" id="btn-restore-data" style="width: 100%; margin-top: 8px;">
              📥 Restaurar desde Backup
            </button>
          </div>

          <!-- SECCIÓN: Aplicación -->
          <div class="settings-section">
            <h3>Aplicación</h3>

            <div class="settings-item">
              <label>Versión</label>
              <div class="value">1.0.0</div>
            </div>

            <div class="settings-item">
              <label>Dark Mode</label>
              <div class="toggle-switch" id="dark-mode-toggle">
                <input type="checkbox" id="dark-mode-checkbox" checked>
                <span class="toggle-slider"></span>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: Variaciones IA -->
          <div class="settings-section">
            <h3>Variaciones Inteligentes</h3>
            <button class="btn btn-primary" id="btn-generar-variaciones" style="width: 100%; margin-bottom: 12px;">
              🤖 Generar Variaciones (IA)
            </button>
            <p style="font-size: 12px; color: #888; margin: 0;">
              Genera nuevas variaciones de ejercicios para la siguiente semana usando Claude IA
            </p>
          </div>

          <!-- SECCIÓN: Datos -->
          <div class="settings-section">
            <h3>Datos</h3>
            <div class="danger-zone">
              <button class="danger-btn" id="btn-clear-data">
                🗑 Borrar Historial
              </button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Registrar event listeners
      this.registrarEventos(container);
    } catch (error) {
      console.error("❌ Error renderizando SETTINGS:", error);
      container.innerHTML = `<div class="error">Error cargando pantalla. Intenta de nuevo.</div>`;
    }
  }

  /**
   * Obtener estado de sincronización
   */
  async obtenerEstadoSincronizacion() {
    try {
      const config = await this.db.obtenerDocumento("config", "sincronizacion");

      return {
        conectado: config?.conectado || false,
        enLinea: navigator.onLine,
        ultimaSync: config?.ultimaSync || "Nunca"
      };
    } catch (error) {
      return {
        conectado: false,
        enLinea: navigator.onLine,
        ultimaSync: "Nunca"
      };
    }
  }

  /**
   * Validar que los servicios de Layer 3 están inicializados
   */
  validarServicios() {
    const sheetsService = window.APP.sheetsService;
    const dbAdapter = window.APP.dbAdapter;

    if (!sheetsService || !dbAdapter) {
      throw new Error("⚠️ Servicios no inicializados. Recarga la página.");
    }

    return { sheetsService, dbAdapter };
  }

  /**
   * Registrar event listeners
   */
  registrarEventos(container) {
    const btnGoogleSignIn = container.querySelector("#btn-google-signin");
    const btnSyncNow = container.querySelector("#btn-sync-now");
    const btnRestoreData = container.querySelector("#btn-restore-data");
    const btnClearData = container.querySelector("#btn-clear-data");
    const btnGenerarVariaciones = container.querySelector("#btn-generar-variaciones");
    const darkModeCheckbox = container.querySelector("#dark-mode-checkbox");

    // Google Sign-In
    btnGoogleSignIn?.addEventListener("click", () => this.manejarGoogleSignIn());

    // Sync manual
    btnSyncNow?.addEventListener("click", () => this.manejarSincronizacion());

    // Restore data
    btnRestoreData?.addEventListener("click", () => this.manejarRestauracion());

    // Generar variaciones con IA
    btnGenerarVariaciones?.addEventListener("click", () => this.manejarGenerarVariaciones());

    // Clear data
    btnClearData?.addEventListener("click", () => this.manejarBorrarDatos(container));

    // Dark mode toggle
    darkModeCheckbox?.addEventListener("change", (e) => this.toggleDarkMode(e.target.checked));
  }

  /**
   * Manejar Google Sign-In
   */
  manejarGoogleSignIn() {
    console.log("🔐 Iniciando Google Sign-In...");
    // TODO: Layer 3 - Implementar Google Drive sync
    alert("Google Sign-In - Se implementará en Layer 3");
  }

  /**
   * Manejar sincronización manual con Google Sheets
   */
  async manejarSincronizacion() {
    console.log("🔄 Sincronizando con Google Sheets...");
    const btnSyncNow = document.querySelector("#btn-sync-now");

    try {
      // Validar servicios
      const { sheetsService, dbAdapter } = this.validarServicios();

      // Mostrar estado de carga
      btnSyncNow.disabled = true;
      btnSyncNow.textContent = "⏳ Sincronizando...";

      // Sincronizar datos
      const result = await sheetsService.syncToSheet(dbAdapter);

      // Mostrar éxito
      alert(`✅ Sincronizado!\n${result.recordsSynced} registros guardados`);

      // Actualizar config en BD (CORREGIDO: key como parámetro separado)
      await this.db.escribirDocumento("config", {
        key: "sincronizacion",
        conectado: true,
        ultimaSync: new Date().toLocaleString()
      });

    } catch (error) {
      console.error("❌ Error en sincronización:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      // Restaurar botón
      if (btnSyncNow) {
        btnSyncNow.disabled = false;
        btnSyncNow.textContent = "✓ Sincronizar Ahora";
      }
    }
  }

  /**
   * Manejar restauración de datos desde backup
   */
  async manejarRestauracion() {
    if (!confirm("⚠️ ¿Restaurar datos desde el último backup?")) {
      return;
    }

    try {
      // Validar servicios
      const { sheetsService, dbAdapter } = this.validarServicios();

      // Restaurar datos
      const result = await sheetsService.restoreFromSheet(dbAdapter);

      // Mostrar éxito
      alert(`✅ Restaurado!\n${result.recordsRestored} registros importados`);

      // Actualizar config en BD
      await this.db.escribirDocumento("config", {
        key: "sincronizacion",
        conectado: true,
        ultimaSync: new Date().toLocaleString()
      });

    } catch (error) {
      console.error("❌ Error en restauración:", error);
      alert(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Manejar generación de variaciones con Claude IA
   */
  async manejarGenerarVariaciones() {
    try {
      const btnGenerarVariaciones = document.querySelector("#btn-generar-variaciones");
      btnGenerarVariaciones.disabled = true;
      btnGenerarVariaciones.textContent = "⏳ Generando con IA...";

      // 2. Importar el servicio de Claude
      const { ClaudeVariacionService } = await import("../../services/claudeVariacionService.js");

      // 3. Leer el día, la semana y los ejercicios actuales
      const configActual = await this.db.obtenerDocumento("config", "variacionActual");
      const diaId = configActual?.value?.diaId;
      const semanaActual = configActual?.value?.numeroSemana || 1;
      const numeroVariacionActual = configActual?.value?.numeroVariacion;
      const ejerciciosActuales = configActual?.value?.ejercicios || [];

      if (!diaId || ejerciciosActuales.length === 0) {
        throw new Error("No se pudo determinar el día de entrenamiento. Recarga la app e intenta de nuevo.");
      }

      // Enfoque muscular del día: "Pierna", "Pecho/Tríceps/Hombro" o "Espalda/Bíceps"
      const { obtenerVariacionDeBD, mapearVariacionDeSemana } = await import("../../skills/variaciones.js");
      const registroActual = await obtenerVariacionDeBD(diaId, numeroVariacionActual);
      const foco = registroActual?.nombre?.split(" - ")[0] || diaId;

      console.log("📋 Día:", diaId, "| Enfoque:", foco, "| Semana:", semanaActual);
      console.log("📋 Ejercicios actuales:", ejerciciosActuales);

      // 4. Generar los ejercicios de la semana siguiente con Claude
      const service = new ClaudeVariacionService();
      const ejerciciosGenerados = await service.generarVariacionesSemana({
        foco,
        ejerciciosActuales,
        semanaActual
      });

      console.log("✅ Ejercicios generados:", ejerciciosGenerados);

      // 5. Guardar en IndexedDB con el formato que usa la app:
      //    store "variaciones", clave [diaId, numeroVariacion]
      const semanaSiguiente = semanaActual + 1;
      const numeroVariacion = mapearVariacionDeSemana(semanaSiguiente);

      const ejercicios = ejerciciosGenerados
        .map((ej, i) => ({
          id: `${diaId}_var${numeroVariacion}_${i + 1}`,
          nombre: ej.nombre,
          series: Number(ej.series) || 3,
          reps: String(ej.reps || "8-10"),
          descanso: Number(ej.descanso) || 60,
          equipo: ej.equipo || ""
        }));

      if (ejercicios.length === 0) {
        throw new Error("Claude no devolvió ejercicios. Intenta de nuevo.");
      }

      await this.db.escribirDocumento("variaciones", {
        diaId,
        numeroVariacion,
        nombre: `${foco} - Variación ${numeroVariacion} (IA)`,
        descripcion: `Generada con IA para la semana ${semanaSiguiente}`,
        generadaConIA: true,
        semanaGenerada: semanaSiguiente,
        ejercicios
      });

      // 6. Mostrar éxito con la lista de ejercicios para validarla
      const lista = ejercicios
        .map(e => `• ${e.nombre} (${e.series}x${e.reps})`)
        .join("\n");
      alert(`✅ Variación generada para la semana ${semanaSiguiente} (${diaId}, variación ${numeroVariacion}):\n\n${lista}`);

    } catch (error) {
      console.error("❌ Error generando variaciones:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      // Restaurar botón
      const btnGenerarVariaciones = document.querySelector("#btn-generar-variaciones");
      if (btnGenerarVariaciones) {
        btnGenerarVariaciones.disabled = false;
        btnGenerarVariaciones.textContent = "🤖 Generar Variaciones (IA)";
      }
    }
  }

  /**
   * Manejar borrado de datos
   */
  async manejarBorrarDatos(container) {
    if (confirm("⚠️ ¿Estás seguro? Esto borrará todo el historial.")) {
      try {
        // Vaciar store de historialPesos
        await this.db.vaciarStore("historialPesos");
        alert("✅ Historial borrado");

        // Re-renderizar
        await this.render(container);
      } catch (error) {
        console.error("❌ Error borrando datos:", error);
        alert("Error al borrar datos");
      }
    }
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(enabled) {
    console.log(`🌙 Dark mode: ${enabled ? "ON" : "OFF"}`);
    // TODO: Layer 6 - Implementar sistema de temas
  }
}