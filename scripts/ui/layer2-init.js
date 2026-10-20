/**
 * 🚀 LAYER 2 INITIALIZATION
 *
 * Punto de entrada para Layer 2
 * Inicializa:
 * - Router (navegación por tabs)
 * - AppController (coordinación de pantallas)
 * - Event listeners
 */

import { Router } from "./router.js";
import { AppController } from "./appController.js";

/**
 * Inicializar Layer 2
 */
export async function inicializarLayer2(db, appContainer) {
  try {
    console.log("🚀 Inicializando Layer 2...");

    // 1. Crear router
    const router = new Router();
    router.init(appContainer);
    console.log("✅ Router inicializado");

    // 2. Crear y inicializar app controller
    const controller = new AppController(db, router);
    await controller.init();
    console.log("✅ AppController inicializado");

    // 3. Guardar referencias globales (para debugging)
    window.__APP__ = {
      dbAdapter: db,  // db aquí es realmente el adapter
      router,
      controller,
      appContainer
    };

    console.log("🎯 LAYER 2 LISTA");

    return { router, controller };
  } catch (error) {
    console.error("❌ Error en inicialización de Layer 2:", error);
    throw error;
  }
}
