/**
 * 🎮 APP CONTROLLER
 *
 * Controlador principal que coordina:
 * - Router / Navegación entre tabs
 * - Pantallas (HOME, WORKOUT, HISTORY, SETTINGS)
 * - Event listeners globales
 * - Sincronización de datos
 */

export class AppController {
  constructor(db, router) {
    this.db = db;
    this.router = router;
    this.screens = {};
  }

  /**
   * Inicializar controller
   */
  async init() {
    console.log("🎮 Inicializando AppController...");

    // Cargar clases de pantallas dinámicamente
    const { HomeScreen } = await import("./screens/home.js");
    const { WorkoutScreen } = await import("./screens/workout.js");
    const { HistoryScreen } = await import("./screens/history.js");
    const { SettingsScreen } = await import("./screens/settings.js");

    // Crear instancias de pantallas
    this.screens.home = new HomeScreen(this.db);
    this.screens.workout = new WorkoutScreen(this.db);
    this.screens.history = new HistoryScreen(this.db);
    this.screens.settings = new SettingsScreen(this.db);

    // Renderizar pantalla inicial
    await this.renderScreen("home");

    // Registrar event listeners globales
    this.registrarEventosGlobales();

    console.log("✅ AppController inicializado");
  }

  /**
   * Renderizar una pantalla específica
   */
  async renderScreen(tabName) {
    const screen = this.screens[tabName];
    const container = this.router.screens[tabName];

    if (!screen || !container) {
      console.warn(`⚠️ Screen no encontrada: ${tabName}`);
      return;
    }

    try {
      console.log(`📱 Renderizando screen: ${tabName}`);
      await screen.render(container);
    } catch (error) {
      console.error(`❌ Error renderizando ${tabName}:`, error);
    }
  }

  /**
   * Registrar event listeners globales
   */
  registrarEventosGlobales() {
    // Escuchar eventos de navegación desde las pantallas
    window.addEventListener("navigate-to-tab", (e) => {
      const tab = e.detail?.tab;
      if (tab) {
        this.router.goToTab(tab);
        // Re-renderizar la pantalla
        this.renderScreen(tab);
      }
    });

    // Recargar HOME cuando vuelva a ese tab
    this.router.navButtons.home?.addEventListener("click", async () => {
      await this.renderScreen("home");
    });

    // Recargar HISTORY cuando vuelva a ese tab
    this.router.navButtons.history?.addEventListener("click", async () => {
      await this.renderScreen("history");
    });

    // Recargar SETTINGS cuando vuelva a ese tab
    this.router.navButtons.settings?.addEventListener("click", async () => {
      await this.renderScreen("settings");
    });
  }

  /**
   * Obtener pantalla actual
   */
  getCurrentScreen() {
    const currentTab = this.router.getCurrentTab();
    return this.screens[currentTab];
  }
}
