# 💪 GYM Hipertrofia Tracker

App web para administrar un programa de entrenamiento personal con **variaciones semanales automáticas** y **sincronización con Google Drive**.

## 🎯 Visión

- **Variaciones semanales automáticas:** La app rota ejercicios cada semana para mantener nuevos estímulos
- **Entrenamiento en tiempo real:** Timer visual, contador de series, registro de pesos
- **Historial de progresión:** Ver cuánto peso usaste cada semana
- **Sincronización Google Drive:** Tus datos siempre en la nube, con acceso desde cualquier dispositivo
- **Offline-first:** Funciona sin internet (sincroniza cuando vuelve la conexión)

## 🛠️ Stack

- **Frontend:** HTML + CSS + JavaScript Vanilla (sin dependencias)
- **BD Local:** IndexedDB (almacenamiento rápido en el navegador)
- **Sincronización:** Google Drive API + OAuth 2.0
- **Arquitectura:** SDD (Specification-Driven Development) con Skills y Agentes

## 🚀 Cómo Empezar

### 1. Clonar o descargar el proyecto
```bash
cd gym-app
```

### 2. Crear Google OAuth 2.0 Credentials
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google Drive API
4. Crea una credencial OAuth 2.0 (Aplicación web)
5. Agrega `http://localhost:8000` como origen autorizado
6. Copia el **Client ID**

### 3. Configurar Client ID
```bash
# Renombra .env.example a config.js
cp .env.example scripts/config.js

# Edita scripts/config.js y pega tu Client ID
# export const GOOGLE_CLIENT_ID = "tu-client-id-aqui"
```

### 4. Ejecutar servidor local
```bash
npm run dev
# Abre http://localhost:8000 en tu navegador
```

## 📋 Estructura del Proyecto

```
gym-app/
├── index.html                 # Punto de entrada
├── scripts/
│   ├── config.js             # Configuración (Client ID)
│   ├── db.js                 # Inicialización IndexedDB
│   ├── main.js               # Orquestador principal
│   ├── skills/               # Funciones reutilizables
│   ├── agentes/              # Orquestadores de lógica
│   └── ui/                   # Renderización y eventos
├── styles/                   # CSS
├── scripts/datos/            # Datos pre-cargados (variaciones)
└── package.json
```

## 🔑 Conceptos Clave

### Skills (Funciones Puras)
Funciones independientes que realizan tareas específicas:
- `ObtenerVariacionActual()` - Calcula qué variación toca esta semana
- `IniciarTimer()` - Gestiona el timer de descanso
- `GuardarPesoEjercicio()` - Guarda peso en IndexedDB
- `SincronizarConGoogleDrive()` - Sube datos a Google Drive

### Agentes (Orquestadores)
Coordinan múltiples skills para lograr un objetivo:
- **AgenteVariacionSemanal** - Detecta y muestra la variación correcta
- **AgenteEntrenamiento** - Ejecuta el entrenamiento paso a paso
- **AgenteHistorial** - Muestra progresión y estadísticas
- **AgenteSincronizacion** - Mantiene datos sincronizados con Google Drive

### Workflows (Flujos de Usuario)
1. **Abrir App** → Cargar variación actual
2. **Entrenar** → Timer, contador de series, registrar pesos
3. **Ver Historial** → Analizar progresión
4. **Sincronizar** → Automático cada 5 min + Manual bajo demanda

## 🧪 Testing

```bash
# Test 1: Variación correcta
# - Simular diferentes semanas
# - Verificar que mapea correctamente

# Test 2: Persistencia de pesos
# - Guardar peso, recargar página
# - Verificar que persiste

# Test 3: Timer visual
# - Iniciar timer, verificar que cuenta hacia atrás
# - Verificar callback al terminar

# Test 4: Búsqueda en historial
# - Filtrar por ejercicio
# - Verificar resultados en tiempo real
```

## 📝 Desarrollo Actual

**Layer 1:** BD + Skills básicos (EN PROGRESO)

Siguiente: AgenteVariacionSemanal + UI Principal

## 🤝 Contribuciones

Este es un proyecto personal de Andrés Morales. Especificación SDD completa disponible en `specification.md`.

## 📄 Licencia

MIT

---

**Hecho con 💪 para entrenamientos consistentes y variados.**
