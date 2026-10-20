/**
 * 🔀 SISTEMA DE NAVEGACIÓN
 *
 * Maneja el routing entre las 4 pantallas principales:
 * - HOME: Variación actual + ejercicios del día
 * - WORKOUT: Entrenamiento activo con timer
 * - HISTORY: Historial de progresión
 * - SETTINGS: Configuración y sincronización
 */

export class Router {
  constructor() {
    this.currentTab = "home";
    this.screens = {
      home: null,
      workout: null,
      history: null,
      settings: null
    };
    this.navButtons = {};
  }

  /**
   * Inicializar router y montar estructura de navegación
   */
  init(appContainer) {
    this.appContainer = appContainer;
    this.crearEstructura();
    this.configurarEventos();
  }

  /**
   * Crear estructura HTML principal con tab navigation
   */
  crearEstructura() {
    // Contenedor principal
    this.appContainer.innerHTML = `
      <div class="app-wrapper">
        <!-- Contenedor de screens -->
        <div class="screens-container">
          <div id="screen-home" class="screen active"></div>
          <div id="screen-workout" class="screen"></div>
          <div id="screen-history" class="screen"></div>
          <div id="screen-settings" class="screen"></div>
        </div>

        <!-- Bottom Navigation -->
        <nav class="bottom-nav">
          <button class="nav-item active" data-tab="home">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Home</span>
          </button>
          <button class="nav-item" data-tab="workout">
            <span class="nav-icon">💪</span>
            <span class="nav-label">Workout</span>
          </button>
          <button class="nav-item" data-tab="history">
            <span class="nav-icon">📊</span>
            <span class="nav-label">History</span>
          </button>
          <button class="nav-item" data-tab="settings">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Settings</span>
          </button>
        </nav>
      </div>
    `;

    // Obtener referencias a los screens
    this.screens.home = document.getElementById("screen-home");
    this.screens.workout = document.getElementById("screen-workout");
    this.screens.history = document.getElementById("screen-history");
    this.screens.settings = document.getElementById("screen-settings");

    // Obtener referencias a los botones de navegación
    const navItems = this.appContainer.querySelectorAll(".nav-item");
    navItems.forEach(item => {
      const tab = item.dataset.tab;
      this.navButtons[tab] = item;
    });
  }

  /**
   * Configurar event listeners para navegación
   */
  configurarEventos() {
    Object.entries(this.navButtons).forEach(([tab, btn]) => {
      btn.addEventListener("click", () => this.goToTab(tab));
    });
  }

  /**
   * Navegar a una tab específica
   */
  goToTab(tabName) {
    // Validar que la tab existe
    if (!this.screens[tabName]) {
      console.warn(`⚠️ Tab desconocida: ${tabName}`);
      return;
    }

    // Ocultar tab actual
    this.screens[this.currentTab].classList.remove("active");
    this.navButtons[this.currentTab].classList.remove("active");

    // Mostrar nueva tab
    this.currentTab = tabName;
    this.screens[tabName].classList.add("active");
    this.navButtons[tabName].classList.add("active");

    console.log(`📱 Navegando a: ${tabName}`);
  }

  /**
   * Obtener el elemento de pantalla activo
   */
  getActiveScreen() {
    return this.screens[this.currentTab];
  }

  /**
   * Obtener tab actual
   */
  getCurrentTab() {
    return this.currentTab;
  }
}
