/**
 * 🚀 MAIN ORCHESTRATOR
 *
 * Punto de entrada de la aplicación
 * Inicializa IndexedDB, carga variaciones, y prepara la app
 */

import { CONFIG, validarConfiguracion } from "./config.js";
import {
  inicializarDB,
  obtenerDB,
  escribirDocumento,
  obtenerTodos,
  vaciarStore
} from "./db.js";

import {
  obtenerVariacionActual,
  calcularNumeroDeSemana,
  esHoyEntrenamiento,
  obtenerProximoDia
} from "./skills/variaciones.js";

import { AgenteVariacionSemanal } from "./agentes/agenteVariacion.js";
import { AgenteSincronizacion } from "./agentes/agenteSincronizacion.js";

import { mostrarNotificacion } from "./ui/renderer.js";
import { inicializarLayer2 } from "./ui/layer2-init.js";
import { DatabaseAdapter } from "./dbAdapter.js";

/**
 * Estado global de la aplicación
 */
const APP = {
  inicializado: false,
  db: null,
  agenteVariacion: null,
  agenteSincronizacion: null,
  variacionActual: null
};

/**
 * 🔥 INICIALIZACIÓN PRINCIPAL
 */
async function inicializarApp() {
  try {
    console.log("🚀 Iniciando GYM Hipertrofia Tracker...");

    // Paso 1: Validar configuración
    validarConfiguracion();

    // Paso 2: Inicializar IndexedDB
    console.log("📦 Inicializando base de datos...");
    APP.db = await inicializarDB();
    console.log("✅ BD inicializada correctamente");

    // Paso 3: Pre-cargar variaciones (solo si está vacío)
    const variacionesExistentes = await obtenerTodos(CONFIG.STORES.VARIACIONES);
    if (variacionesExistentes.length === 0) {
      await preCargarVariaciones();
      console.log("✅ Variaciones pre-cargadas");
    } else {
      console.log(`✅ Variaciones encontradas (${variacionesExistentes.length} registros)`);
    }

    // Paso 4: Inicializar configuración base
    await inicializarConfigBase();
    console.log("✅ Configuración base inicializada");

    // Paso 5: Crear agentes
    APP.agenteVariacion = new AgenteVariacionSemanal();
    APP.agenteSincronizacion = new AgenteSincronizacion();
    console.log("✅ Agentes creados");

    // Paso 6: Inicializar datos para Layer 2
    await inicializarDatosLayer2();
    console.log("✅ Datos de Layer 2 inicializados");

    // Paso 7: Inicializar Layer 2 (UI con Router y Pantallas)
    const appContainer = document.getElementById("app");
    const dbAdapter = new DatabaseAdapter(APP.db);
    const { router, controller } = await inicializarLayer2(dbAdapter, appContainer);
    APP.router = router;
    APP.controller = controller;
    APP.dbAdapter = dbAdapter;
    console.log("✅ Layer 2 inicializado");

    // ============= LAYER 3: Google Sheets Sync =============
    try {
      const { GoogleSheetsService } = await import('./services/googleSheets.js');
      console.log('✅ GoogleSheetsService importada:', GoogleSheetsService);

    const SHEET_ID = '18h9HNkSWt657j3TgtYp5EtxVfXnTVPdd_XCSvhRyEZA';
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52M-0YrNNiNYvnikCayWVgdjudyVy0v7aQejgoIbQBRO67rKrkC9KJRC1S3ixp2QB/exec';
    const sheetsService = new GoogleSheetsService(SHEET_ID, SCRIPT_URL);

      APP.sheetsService = sheetsService;
      console.log('✅ APP.sheetsService asignada:', APP.sheetsService);
      console.log("✅ Layer 3 Services Initialized (Google Sheets)");
    } catch (error) {
      console.error("❌ Error inicializando Layer 3:", error);
      throw error;
    }

    // Paso 8: Iniciar sincronización automática (si hay Client ID)
    if (CONFIG.GOOGLE_CLIENT_ID) {
      await APP.agenteSincronizacion.iniciarSincronizacionAutomatica();
      console.log("✅ Sincronización automática iniciada");
    }

    APP.inicializado = true;
    console.log("🎯 APP LISTA");
    mostrarNotificacion("App cargada correctamente", "success");

  } catch (error) {
    console.error("❌ Error en inicialización:", error);
    mostrarNotificacion(`Error: ${error.message}`, "error");
  }
}

/**
 * Pre-cargar variaciones desde archivo JSON
 */
async function preCargarVariaciones() {
  try {
    // Importar las variaciones pre-definidas
    const response = await fetch("./scripts/datos/variaciones.json");
    const variacionesJSON = await response.json();

    let totalCargados = 0;

    // Iterar sobre cada día (martes, miercoles, viernes)
    for (const [diaId, variacionesPorDia] of Object.entries(variacionesJSON)) {
      // Iterar sobre cada variación (1-5)
      for (const [varKey, variacionData] of Object.entries(variacionesPorDia)) {
        // Extraer número de variación (variacion1 -> 1)
        const numeroVariacion = parseInt(varKey.replace("variacion", ""));

        // Guardar en BD
        await escribirDocumento(CONFIG.STORES.VARIACIONES, {
          diaId,
          numeroVariacion,
          ...variacionData
        });

        totalCargados++;
      }
    }

    console.log(`✅ Pre-cargadas ${totalCargados} variaciones`);
  } catch (error) {
    console.error("❌ Error cargando variaciones:", error);
    throw error;
  }
}

/**
 * Inicializar configuración base
 */
async function inicializarConfigBase() {
  const configItems = [
    { key: "horaInicio", value: CONFIG.TRAINING_START },
    { key: "duracionVentana", value: CONFIG.TRAINING_DURATION_MIN },
    { key: "intervaloSincronizacion", value: CONFIG.SYNC_INTERVAL_MS },
    { key: "ultimaSincronizacion", value: Date.now() }
  ];

  for (const item of configItems) {
    await escribirDocumento(CONFIG.STORES.CONFIG, item);
  }
}

/**
 * Inicializar datos de configuración
 * (ahora delegado a las pantallas individuales de Layer 2)
 */
async function inicializarDatosLayer2() {
  try {
    // Detectar si hoy es día de entrenamiento
    const esHoy = esHoyEntrenamiento();
    const proximoDia = obtenerProximoDia();

    console.log("📅 Información de hoy:");
    console.log(`   ¿Es hoy día de entrenamiento? ${esHoy ? `Sí (${esHoy})` : "No"}`);
    console.log(`   Próximo entrenamiento: ${proximoDia.diaId} (en ${proximoDia.diasAlProximo} día/s)`);

    // Obtener variación para el próximo día
    const variacionProximo = await obtenerVariacionActual(proximoDia.diaId, proximoDia.fecha);

    console.log("📊 Variación actual:");
    console.log(`   Semana: ${variacionProximo.numeroSemana}`);
    console.log(`   Variación: ${variacionProximo.numeroVariacion}`);
    console.log(`   Día: ${proximoDia.diaId}`);
    console.log(`   Ejercicios: ${variacionProximo.variacionData?.ejercicios?.length || 0}`);

    // Guardar en config para que las pantallas accedan
    await escribirDocumento(CONFIG.STORES.CONFIG, {
      key: "variacionActual",
      value: {
        numeroVariacion: variacionProximo.numeroVariacion,
        numeroSemana: variacionProximo.numeroSemana,
        diaId: proximoDia.diaId,
        fecha: proximoDia.fecha,
        ejercicios: variacionProximo.variacionData?.ejercicios || []
      }
    });
  } catch (error) {
    console.warn("⚠️ No se pudo inicializar datos de Layer 2:", error);
  }
}

/**
 * Punto de entrada: Ejecutar cuando el DOM esté listo
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✨ DOM loaded");
  inicializarApp();
});

// Exportar APP para debugging en consola
window.APP = APP;