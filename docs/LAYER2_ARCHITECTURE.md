# 🏗️ LAYER 2 ARCHITECTURE

## Overview

Layer 2 implementa la interfaz de usuario principal con un sistema de navegación por tabs (bottom navigation) y 4 pantallas independientes.

```
┌─────────────────────────────────────┐
│     APP WRAPPER (app-wrapper)       │
├─────────────────────────────────────┤
│   SCREENS CONTAINER                 │
│  ┌──────────────────────────────┐   │
│  │  HOME Screen (active)        │   │
│  │  - Saludo                    │   │
│  │  - Variación card            │   │
│  │  - Exercise list             │   │
│  │  - Start button              │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  WORKOUT Screen (hidden)     │   │
│  │  - Timer                     │   │
│  │  - Current exercise          │   │
│  │  - Set counter               │   │
│  │  - Weight input              │   │
│  │  - Action buttons            │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  HISTORY Screen (hidden)     │   │
│  │  - Exercise filter           │   │
│  │  - Stats cards               │   │
│  │  - Data table                │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  SETTINGS Screen (hidden)    │   │
│  │  - Google sync               │   │
│  │  - App settings              │   │
│  │  - Danger zone               │   │
│  └──────────────────────────────┘   │
├─────────────────────────────────────┤
│  BOTTOM NAV (sticky)                │
│  [🏠 Home] [💪 Workout] [📊 Hx] [⚙️ Set] │
└─────────────────────────────────────┘
```

## File Structure

### Router (`scripts/ui/router.js`)
**Responsabilidad:** Gestionar navegación entre tabs y cambios de pantalla.

```javascript
class Router {
  init(appContainer)           // Crear estructura HTML
  goToTab(tabName)             // Cambiar tab actual
  getActiveScreen()            // Obtener elemento de pantalla actual
  getCurrentTab()              // Obtener nombre de tab actual
}
```

**Features:**
- Crea estructura HTML de screens + bottom nav
- Maneja eventos click en nav items
- Transiciones smooth con CSS
- Estado de active button

### AppController (`scripts/ui/appController.js`)
**Responsabilidad:** Coordinar carga y renderizado de pantallas.

```javascript
class AppController {
  init()                       // Cargar clases de screens e inicializar
  renderScreen(tabName)        // Renderizar una pantalla
  getCurrentScreen()           // Obtener instancia de pantalla actual
}
```

**Features:**
- Importa dinámicamente las clases de pantallas
- Crea instancias de cada screen
- Renderiza pantalla inicial (HOME)
- Registra event listeners globales

### Layer 2 Init (`scripts/ui/layer2-init.js`)
**Responsabilidad:** Punto de entrada para Layer 2.

```javascript
async function inicializarLayer2(db, appContainer)
  // Retorna: { router, controller }
```

**Flow:**
1. Crear Router
2. Crear AppController
3. Guardar referencias globales

## Screen Architecture

Cada screen es una clase que implementa:

```javascript
class ScreenName {
  constructor(db)              // Recibir instancia de BD
  async render(container)      // Renderizar pantalla
  registrarEventos(container)  // Agregar event listeners
}
```

### HomeScreen
**Datos necesarios:**
- Variación actual (semana, grupo muscular, día)
- Lista de ejercicios

**Métodos principales:**
- `obtenerVariacionActual()` - Consultar config en DB
- `obtenerEjerciciosHoy()` - Obtener ejercicios de la variación
- `obtenerFechaFormato()` - Formatear fecha local

### WorkoutScreen
**Datos necesarios:**
- Estado del entrenamiento (ejercicio actual, serie actual)
- Timer de descanso

**Métodos principales:**
- `obtenerEstadoEntrenamiento()` - Obtener del DB o crear inicial
- `iniciarTimer()` - Countdown en segundos
- `completarSerie()` - Guardar peso en historialPesos
- `saltarSerie()` - Avanzar sin guardar

### HistoryScreen
**Datos necesarios:**
- Lista de ejercicios únicos
- Historial de registros

**Métodos principales:**
- `obtenerEjerciciosUnicos()` - Extraer lista de exercises.historialPesos
- `calcularStats()` - Máximo y promedio
- `obtenerHistorial()` - Últimos 20 registros

### SettingsScreen
**Datos necesarios:**
- Estado de sincronización

**Métodos principales:**
- `obtenerEstadoSincronizacion()` - Consultar config
- `manejarGoogleSignIn()` - Placeholder (Layer 3)
- `manejarSincronizacion()` - Placeholder (Layer 3)
- `manejarBorrarDatos()` - Limpiar historialPesos
- `toggleDarkMode()` - Placeholder (Layer 6)

## Data Flow

### Reading Data
```
Screen.render()
  → this.db.obtenerDocumento(store, id)
  → Consultar IndexedDB
  → Retornar data
  → Renderizar HTML
```

### Writing Data
```
Button.click()
  → Screen.event.listener()
  → Validar input
  → this.db.escribirDocumento(store, id, data)
  → Actualizar IndexedDB
  → Feedback al usuario
```

### Navigation
```
User clicks nav item
  → Router.goToTab(tab)
  → Hide current screen
  → Show new screen
  → AppController.renderScreen(tab)
  → Load data
  → Render HTML
```

## State Management

### Local State (Component Level)
Cada screen puede mantener estado local:
```javascript
class WorkoutScreen {
  constructor(db) {
    this.db = db;
    this.timerInterval = null;  // Local state
    this.tiempoRestante = 0;
  }
}
```

### Global State (IndexedDB)
Datos persistentes en BD:
- `variaciones` - Definiciones de variaciones
- `config` - Configuración (variación actual, etc)
- `historialPesos` - Registro de entrenamientos
- `entrenamientos` - Estado actual del workout

### Navigation State (Router)
```javascript
this.router.currentTab = "home"  // Pantalla activa
```

## Event Flow

### Navigation Events
```
User clicks "💪 Workout" nav item
  ↓
router.goToTab("workout")
  ↓
appController.renderScreen("workout")
  ↓
workoutScreen.render(container)
  ↓
UI updates
```

### Custom Events
Pantallas pueden disparar eventos personalizados:
```javascript
// En HomeScreen
button.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("navigate-to-tab", {
    detail: { tab: "workout" }
  }));
});

// En AppController (escucha)
window.addEventListener("navigate-to-tab", (e) => {
  this.router.goToTab(e.detail.tab);
  this.renderScreen(e.detail.tab);
});
```

## Styling

### CSS Custom Properties
```css
:root {
  --primary: #d4fb50      /* Lima - botones, accents */
  --secondary: #14130f    /* Ink - headers oscuros */
  --success: #10b981      /* Verde - confirm */
  --danger: #ef4444       /* Rojo - delete */
  --bg-dark: #0a0a0a      /* Fondo oscuro */
  --surface-dark: #1a1a1a /* Superficies */
  --text-dark: #f0f0f0    /* Texto claro */
}
```

### Screen Switching
```css
.screen {
  opacity: 0;             /* Hidden */
  pointer-events: none;
}

.screen.active {
  opacity: 1;             /* Visible */
  pointer-events: auto;
}
```

### Responsive
Mobile-first approach:
- Base: 390px mobile
- Breakpoint: 768px tablet
- Breakpoint: 1200px desktop

## Testing Strategy

### Unit Testing
- Cada screen renderiza correctamente
- Métodos de data fetching retornan datos esperados
- Event listeners se registran

### Integration Testing
- Router navega entre tabs
- AppController carga pantallas
- Pantallas se comunican vía eventos

### E2E Testing
- User flow: HOME → WORKOUT → SETTINGS
- Data persistence: cambios se guardan en DB
- Navigation flow: todos los tabs son accesibles

## Performance Considerations

### Lazy Loading
Pantallas se crean pero no se renderizan hasta necesarias:
```javascript
// Solo renderizar cuando usuario hace click en tab
window.addEventListener("navigate-to-tab", async (e) => {
  await this.renderScreen(e.detail.tab);
});
```

### Re-render Strategy
- HOME: Re-render cuando vuelve a tab
- WORKOUT: Re-render timer cuando inicia
- HISTORY: Re-render cuando cambia filtro
- SETTINGS: Re-render cuando click en tab

### Database Queries
- `obtenerDocumento()` - Single record
- `obtenerTodos()` - All records (cached in memory)
- Usar filtros en JavaScript cuando sea posible

## Future Improvements

### Layer 3
- Agregar service worker para offline
- Implementar Google Drive sync

### Layer 4
- Agregar animations transitions
- Mejorar feedback visual

### Layer 5
- Agregar analytics
- Tracking de eventos

### Layer 6
- Agregar theme system
- Light/Dark mode toggle

---

**Versión:** 1.0
**Última actualización:** 2026-10-06
