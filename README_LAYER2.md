# GYM Hipertrofia Tracker - Layer 2 Overview

## Quick Start

```bash
# Navigate to project directory
cd /home/claude/gym-app

# HTTP server already running on port 8000
# Just open browser to: http://localhost:8000

# To restart server if needed:
python3 -m http.server 8000
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ index.html (type="module")                          │
├─────────────────────────────────────────────────────┤
│ main.js (Orchestrator)                              │
│ ├─ Initializes IndexedDB                            │
│ ├─ Pre-loads exercise variations                    │
│ ├─ Creates DatabaseAdapter wrapper                  │
│ └─ Initializes Layer 2                              │
├─────────────────────────────────────────────────────┤
│ layer2-init.js                                      │
│ ├─ Creates Router                                   │
│ ├─ Creates AppController                            │
│ └─ Sets up global references                        │
├─────────────────────────────────────────────────────┤
│ Router (Navigation)                                 │
│ ├─ Manages 4 tabs (HOME, WORKOUT, HISTORY, SETTINGS)
│ └─ Controls screen visibility                       │
├─────────────────────────────────────────────────────┤
│ AppController (Coordination)                        │
│ ├─ Loads screen classes dynamically                │
│ ├─ Renders screens into containers                 │
│ └─ Handles navigation events                        │
├─────────────────────────────────────────────────────┤
│ DatabaseAdapter (Data Access)                       │
│ ├─ Wraps IndexedDB methods                          │
│ ├─ Error handling with fallbacks                    │
│ └─ Passed to all screens                            │
├─────────────────────────────────────────────────────┤
│ 4 Screens (Views)                                   │
│ ├─ HomeScreen (variation + exercise list)           │
│ ├─ WorkoutScreen (timer + weight logging)           │
│ ├─ HistoryScreen (stats + progression table)        │
│ └─ SettingsScreen (sync + configuration)            │
└─────────────────────────────────────────────────────┘
```

## File Organization

### Core UI Layer
- `scripts/ui/router.js` - Tab navigation (✅ Working)
- `scripts/ui/appController.js` - Screen coordination (✅ Working)
- `scripts/ui/layer2-init.js` - Initialization (✅ Working)

### Screens (Views)
- `scripts/ui/screens/home.js` - Home view (✅ Fixed)
- `scripts/ui/screens/workout.js` - Workout view (✅ Fixed)
- `scripts/ui/screens/history.js` - History view (✅ Working)
- `scripts/ui/screens/settings.js` - Settings view (✅ Fixed)

### Data Layer
- `scripts/db.js` - IndexedDB operations
- `scripts/dbAdapter.js` - Wrapper for screens (✅ New)

### Styling
- `styles/layer2.css` - All UI styles (661 lines)

## Key Concepts

### 1. Screen Architecture
Each screen is a class that implements:
```javascript
class ScreenName {
  constructor(db) { this.db = db; }           // Receive adapter
  async render(container) { ... }             // Render HTML
  registrarEventos(container) { ... }         // Setup listeners
  async obtenerDatos() { ... }                // Query database
}
```

### 2. Navigation
```javascript
// User clicks nav button
↓
Router.goToTab(tabName)                       // Update active state
↓
AppController.renderScreen(tabName)           // Render new screen
↓
Screen.render(container)                      // Generate HTML
↓
Screen.registrarEventos(container)            // Setup event listeners
```

### 3. Data Access Pattern
```javascript
// In any screen:
const data = await this.db.obtenerDocumento("store", key);
const allRecords = await this.db.obtenerTodos("store");
await this.db.escribirDocumento("store", dataObject);
```

### 4. Event Communication
```javascript
// Screen wants to navigate:
window.dispatchEvent(new CustomEvent("navigate-to-tab", {
  detail: { tab: "workout" }
}));

// AppController listens:
window.addEventListener("navigate-to-tab", (e) => {
  this.router.goToTab(e.detail.tab);
  this.renderScreen(e.detail.tab);
});
```

## Data Models

### variacionActual (config store)
```json
{
  "key": "variacionActual",
  "value": {
    "numeroVariacion": 1,
    "numeroSemana": 3,
    "diaId": "martes",
    "fecha": "2026-10-06",
    "ejercicios": [
      {
        "id": "bench-press-1",
        "nombre": "Press Banca",
        "series": 5,
        "reps": 8,
        "descanso": 90
      }
    ]
  }
}
```

### historialPesos (weight records)
```json
{
  "id": "Press Banca-1728216485123",
  "ejercicio": "Press Banca",
  "peso": 80.5,
  "fecha": "2026-10-06T15:30:00Z",
  "serie": 3
}
```

## Common Tasks

### Add New Screen
1. Create `scripts/ui/screens/myscreen.js`
2. Implement `render()` and `registrarEventos()`
3. Add to AppController imports
4. Add nav button in Router

### Modify Home Screen
Edit `scripts/ui/screens/home.js`:
- Change `obtenerVariacionActual()` to fetch different data
- Modify HTML template in `render()`
- Update event listeners in `registrarEventos()`

### Add Styling
Edit `styles/layer2.css`:
- Add CSS classes matching screen structure
- Use CSS variables (--primary, --success, etc)
- Ensure responsive breakpoints (768px, 1200px)

### Fix Database Issues
Check `FIXES_APPLIED.md` for:
- How screens access data
- Composite key patterns
- Data structure expectations

## Testing

### Quick Verification
```bash
# Run in browser console (F12)
window.__APP__.router.goToTab("workout")
window.__APP__.controller.renderScreen("workout")
```

### Full Testing
See `TESTING_GUIDE.md` for 100+ test cases

### Data Inspection
```javascript
// Check what's in database
await window.__APP__.dbAdapter.obtenerTodos("historialPesos")
await window.__APP__.dbAdapter.obtenerDocumento("config", "variacionActual")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank screen | Check console (F12) for errors, reload page |
| No data | Refresh, check IndexedDB in DevTools |
| Navigation broken | Check nav buttons have `data-tab` attributes |
| Styles look wrong | Check layer2.css loaded in Network tab |
| Database errors | Verify composite keys match store schema |

## Performance Notes

- Screens created but not rendered until needed (lazy loading)
- Each screen re-renders when selected (fresh data)
- No real-time sync yet (Layer 3 feature)
- Timer runs only on WORKOUT screen

## Security Notes

- No sensitive data stored locally (weights/reps only)
- No authentication yet (Layer 3 feature)
- IndexedDB is client-only (no server sync yet)
- Google Drive sync coming in Layer 3

## Next Steps: Layer 3

When ready to implement Google Drive sync:
1. Add Google Sign-In logic to SettingsScreen
2. Implement backup/restore in AgenteSincronizacion
3. Add offline detection and queue
4. Implement conflict resolution

See `LAYER2_READY.md` for full status.

---

**Layer 2 Status:** ✅ PRODUCTION READY  
**Last Updated:** 2026-10-06  
**For issues:** Check TESTING_GUIDE.md or FIXES_APPLIED.md
