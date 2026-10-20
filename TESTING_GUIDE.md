# 🧪 TESTING GUIDE - Layer 2 Implementation

## Pre-requisitos
- HTTP Server corriendo en puerto 8000 (verificar con `ps aux | grep http.server`)
- Acceder a `http://localhost:8000` en el navegador

## 📋 Test Checklist

### 1. INICIALIZACIÓN Y CARGA
- [ ] La app carga sin errores (verificar Console)
- [ ] El DOM muestra el elemento `#app` con estructura correcta
- [ ] Se ve la barra de navegación inferior con 4 tabs (🏠 💪 📊 ⚙️)
- [ ] HOME screen es visible por defecto
- [ ] No hay errores de módulos ES6 en la consola

**Verificar en Console:**
```javascript
console.log(window.__APP__)
// Debería mostrar: { dbAdapter, router, controller, appContainer }
```

### 2. HOME SCREEN
- [ ] Muestra saludo "¡Hola!" con fecha actual
- [ ] Muestra card de "Variación Actual" con información
- [ ] Muestra lista de ejercicios numerada (1, 2, 3...)
- [ ] Cada ejercicio muestra: nombre, series × reps • descanso
- [ ] Botón "Comenzar Entrenamiento" es clickeable
- [ ] Botón navega a WORKOUT screen

**Test data:**
```javascript
// En la consola, verificar datos de variación
window.__APP__.dbAdapter.obtenerDocumento("config", "variacionActual")
  .then(doc => console.log(doc))
```

### 3. NAVIGATION
- [ ] Click en 💪 WORKOUT → navega a WORKOUT screen
- [ ] Click en 📊 HISTORY → navega a HISTORY screen
- [ ] Click en ⚙️ SETTINGS → navega a SETTINGS screen
- [ ] Volver a 🏠 HOME → navega a HOME screen
- [ ] Transiciones son suaves (opacity fade)
- [ ] Bottom nav muestra estado "active" en tab actual
- [ ] Bottom nav es sticky (no se mueve al scroll)

### 4. WORKOUT SCREEN
- [ ] Muestra header con día y grupo muscular
- [ ] Muestra timer de descanso en formato MM:SS
- [ ] Muestra ejercicio actual
- [ ] Muestra contador de serie (ej: "3 / 5")
- [ ] Input de peso es visible y aceptable números decimales
- [ ] Botón "✓ Serie OK" funciona (verde)
- [ ] Botón "Saltar" funciona (secundario)
- [ ] Próximo ejercicio se muestra correctamente
- [ ] Timer cuenta regresivamente desde valor de descanso

**Test Flow:**
1. Ir a WORKOUT
2. Ingresar peso en input (ej: 70.5)
3. Click "Serie OK"
4. Verificar que peso se guarda en IndexedDB
5. Contador de serie avanza
6. Input se limpia

**Verificar guardado:**
```javascript
// En la consola
window.__APP__.dbAdapter.obtenerTodos("historialPesos")
  .then(records => console.log(records))
```

### 5. HISTORY SCREEN
- [ ] Muestra dropdown con lista de ejercicios
- [ ] Dropdown es funcional (puede cambiar selección)
- [ ] Muestra stats: "Máximo" y "Promedio" de peso
- [ ] Tabla tiene columnas: Fecha, Series, Peso
- [ ] Tabla muestra datos ordenados por fecha (más reciente primero)
- [ ] Fechas están formateadas como "DD Mon" (ej: "06 Oct")
- [ ] Stats se actualizan al cambiar ejercicio en dropdown
- [ ] Si no hay datos, muestra "—" en stats

**Test:**
1. Ir a WORKOUT y grabar algunos pesos
2. Ir a HISTORY
3. Seleccionar ejercicio del dropdown
4. Verificar que stats y tabla se actualizan

### 6. SETTINGS SCREEN
- [ ] Muestra sección "Sincronización" con botón Google
- [ ] Muestra estado: "EN LÍNEA" o "DESCONECTADO"
- [ ] Muestra "Última sincronización"
- [ ] Botón "Sincronizar Ahora" es clickeable
- [ ] Muestra sección "Aplicación" con versión 1.0.0
- [ ] Muestra Dark Mode toggle (placeholder)
- [ ] Muestra sección "Datos" con botón "Borrar Historial"
- [ ] Botón "Borrar Historial" pide confirmación
- [ ] Después de borrar, historialPesos store está vacío

**Test Clear Data:**
1. Ir a WORKOUT y grabar algunos pesos
2. Ir a SETTINGS
3. Click "Borrar Historial"
4. Confirmar en el diálogo
5. Verificar en HISTORY que tabla está vacía
6. Verificar en console: `window.__APP__.dbAdapter.obtenerTodos("historialPesos")`

### 7. DATA PERSISTENCE
- [ ] Datos guardados persisten al refrescar la página
- [ ] IndexedDB stores están poblados correctamente
- [ ] config store contiene "variacionActual"
- [ ] historialPesos store contiene registros de pesos

**Verificar en Console:**
```javascript
window.__APP__.dbAdapter.obtenerTodos("variaciones").then(v => console.log("Variaciones:", v.length))
window.__APP__.dbAdapter.obtenerTodos("config").then(c => console.log("Config:", c))
window.__APP__.dbAdapter.obtenerTodos("historialPesos").then(h => console.log("Historial:", h))
```

### 8. ESTILOS Y RESPONSIVIDAD
- [ ] Colores se ven correctamente (Lima #d4fb50 en botones primarios)
- [ ] Dark mode es visible (fondo oscuro #0a0a0a)
- [ ] Buttons tienen estados hover (cambio de color)
- [ ] Inputs tienen focus state (border lima)
- [ ] Cards tienen padding y spacing correcto
- [ ] Tabla es scrollable si hay muchos registros
- [ ] Layout es responsive (probado en diferentes tamaños)

### 9. ERROR HANDLING
- [ ] Si no hay variación, HOME muestra defaults ("Desconocido", etc)
- [ ] Si no hay ejercicios, WORKOUT muestra placeholder ("—")
- [ ] Si IndexedDB falla, mensajes de error aparecen
- [ ] Alerts muestran para acciones importantes (Clear Data, Save)

### 10. BROWSER CONSOLE
- [ ] No hay errores rojos (❌)
- [ ] Logs verdes (✅) muestran inicialización correcta
- [ ] Logs amarillos (⚠️) son informativos, no críticos
- [ ] Network tab no muestra errores 404

**Expected Console Output:**
```
🚀 Iniciando GYM Hipertrofia Tracker...
📦 Inicializando base de datos...
✅ BD inicializada correctamente
✅ Variaciones encontradas (15 registros)
✅ Configuración base inicializada
✅ Agentes creados
✅ Datos de Layer 2 inicializados
🚀 Inicializando Layer 2...
✅ Router inicializado
✅ AppController inicializado
🎯 LAYER 2 LISTA
✨ DOM loaded
🎯 APP LISTA
```

## 🔍 Debugging Tips

### Acceder a objetos globales:
```javascript
window.__APP__.dbAdapter      // Para hacer queries
window.__APP__.router         // Para acceder al router
window.__APP__.controller     // Para acceder al controller
window.__APP__.appContainer   // El elemento #app
```

### Verificar estado del router:
```javascript
window.__APP__.router.currentTab  // Tab actual
window.__APP__.router.screens     // Referencia a elementos
```

### Hacer queries a IndexedDB directamente:
```javascript
window.__APP__.dbAdapter.obtenerDocumento("config", "variacionActual")
window.__APP__.dbAdapter.obtenerTodos("historialPesos")
window.__APP__.dbAdapter.vaciarStore("historialPesos")
```

### Simular acciones de usuario:
```javascript
// Navegar a un tab
window.__APP__.router.goToTab("workout")
window.__APP__.controller.renderScreen("workout")

// Re-renderizar pantalla actual
const currentTab = window.__APP__.router.getCurrentTab()
window.__APP__.controller.renderScreen(currentTab)
```

## 📊 Test Data

Si quieres pruebas rápidas con datos pre-poblados:

```javascript
// Agregar algunos registros de pesos
const testData = [
  { ejercicio: "Press Banca", peso: 80, serie: 1, fecha: new Date().toISOString() },
  { ejercicio: "Press Banca", peso: 82, serie: 2, fecha: new Date().toISOString() },
  { ejercicio: "Sentadilla", peso: 120, serie: 1, fecha: new Date().toISOString() }
]

testData.forEach(record => {
  window.__APP__.dbAdapter.escribirDocumento("historialPesos", {
    id: `test-${Date.now()}-${Math.random()}`,
    ...record
  })
})
```

## ✅ Checklist Final

- [ ] Todas las pantallas cargan y renderizan
- [ ] Navegación funciona en los 4 tabs
- [ ] Datos se guardan en IndexedDB
- [ ] Datos persisten al refrescar
- [ ] No hay errores en consola
- [ ] Estilos se ven correctamente
- [ ] App es responsive
- [ ] Todos los botones son funcionales

**Status:** Ready for refinement and Layer 3 implementation

---

**Nota:** Este testing guide es para verificar que Layer 2 está funcionando correctamente. Para issues, revisar la consola del navegador (F12) y consultar LAYER2_ARCHITECTURE.md para entender el flow.
