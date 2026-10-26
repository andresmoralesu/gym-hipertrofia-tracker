# Suite E2E — GYM Hipertrofia Tracker

Playwright Test + TypeScript. Corre contra la app real servida en local; **no** llama al Apps Script ni a la API de Claude.

## Cómo correr

```bash
npm install
npx playwright install chromium        # una sola vez (añade webkit para Safari real)

npm test                               # toda la suite (desktop + iPhone 14 emulado)
npm run test:ui                        # modo interactivo (el mejor para depurar)
npm run test:mobile                    # solo iPhone 14
npm run test:safari                    # Safari real (WebKit); requiere: npx playwright install webkit
npm run test:report                    # abre el último reporte HTML
npm run typecheck
```

Un test suelto: `npx playwright test -g "avanza 1 → 2 → 3"`.

## Cómo está armada

```
e2e/
  fixtures/test.ts          test extendido: reloj fijo, mocks, captura de errores, "nuevoDispositivo"
  fixtures/appsScriptMock.ts  doble del Apps Script (JSONP de historial/IA + POST de sync)
  pages/                    Page Objects: AppPage, HomePage, WorkoutPage, HistoryPage, SettingsPage
  support/data.ts           lee scripts/datos/variaciones.json → los tests usan la misma fuente de verdad
  support/idb.ts            lectura/escritura directa de IndexedDB (arrange/assert)
  specs/01…08-*.spec.ts     los tests
```

**Determinismo** (por qué no es inestable):
- **Reloj fijo**: la app ve *viernes 13-nov-2026 10:00 (Bogotá)* → semana 3 del programa (empezó el lunes 26-oct-2026), variación 3, rutina de viernes. Cada spec puede cambiarlo con `test.use({ ahora })`.
- **Cero red real**: Apps Script y Claude están simulados; las librerías de Google del `<head>` se reemplazan por scripts vacíos; cualquier otra request externa se bloquea y el smoke falla si aparece.
- **BD limpia por test**: cada test usa un contexto nuevo → IndexedDB vacía.
- **Listo = `APP.inicializado`**: se espera la señal que la propia app marca al terminar de arrancar, sin `waitForTimeout`.
- Diálogos `alert/confirm` se aceptan y quedan registrados (`app.dialogs`); `app.confirmAnswer = false` para cancelar.

## Qué cubre (102 tests)

| Spec | Cubre |
|---|---|
| 01 smoke | arranque sin errores ni requests externas, 15 variaciones precargadas, navegación |
| 02 home | semana del programa, ejercicios del día (7 días de la semana), "Comenzar Entrenamiento" |
| 03 workout | contador 1→2→3→modal, siguiente ejercicio, validación de peso, saltar, sesión completa (24 series), persistencia del avance y descarte al cambiar de día |
| 04 history | filas/orden/estadísticas, filtro, límite 20, integración Workout→History |
| 05 settings | sync a Sheets, restaurar en otro dispositivo, idempotencia, duplicados, errores de red, borrar historial |
| 06 IA | contrato con el Apps Script, variación de la semana siguiente, ciclo 5→1, errores, estado del botón, los 3 enfoques |
| 07 layout móvil | barra inferior, botones alcanzables, sin scroll horizontal (solo proyectos móviles) |
| 08 semanas del programa | `calcularNumeroDeSemana` con fechas límite, ciclo de variaciones, `obtenerProximoDia` |

## Defectos conocidos (hallazgos)

Los tests `BUG-xx` usan `test.fail()`: pasan mientras el defecto exista y **empiezan a fallar (“unexpected pass”) cuando lo arregles** → entonces quita el `test.fail` y queda como test de regresión.

| ID | Defecto | Dónde |
|---|---|---|
| ~~BUG-01~~ (corregido) | Home muestra "Desconocido • Hoy" y Workout "Hoy • Desconocido": `variaciones.json` no tiene `grupoMuscular` ni `dia` (solo `nombre`: "Espalda/Bíceps - Variación 3") | 02, 03 |
| ~~BUG-02~~ (corregido) | La pestaña **Workout** de la barra inferior queda vacía; solo "Comenzar Entrenamiento" la construye | 03 |
| BUG-03 | "Volver a Home" del modal cambia `location.hash` pero el router no lo escucha: se queda en Workout | 03 |
| BUG-04 | Cada "Sincronizar Ahora" reenvía TODO el historial y la hoja acumula filas duplicadas (la restauración ya las deduplica) | 05 |

Observaciones (no son fallos, decide tú):
- **NOTE-05 (resuelta)** — Cada rutina dura las 24 h de su día: martes = Pierna, miércoles = Pecho/Tríceps/Hombro, viernes = Espalda/Bíceps; en día de descanso se ofrece la siguiente. Cambia a las 0:00 (también con la app abierta o al volver de segundo plano). Specs 02, 08 y 09.
- **NOTE-06** — `index.html` carga módulos ES (`config.js`, `db.js`…) como `<script>` clásicos: 3 errores de consola inofensivos. Están en la lista `RUIDO_CONOCIDO` de `fixtures/test.ts`; cualquier otro error rompe el smoke.
- **NOTE-07** — En el historial la columna "Series" muestra el total del ejercicio (3) en cada fila, no el número de la serie realizada; y `reps` guarda el objetivo ("10-12"), no las repeticiones hechas.

## Validación de la propia suite

Se comprobó que los tests detectan los bugs ya corregidos: con el `workout.js` original (sin arreglo) fallan 10 tests; con el `layer2.css` original fallan 5 de layout. Además, 3 ejecuciones seguidas en paralelo (306 tests) sin flakiness.

**Límite conocido:** Chromium/WebKit headless no reproducen la barra de herramientas *dinámica* de Safari en iOS (el origen real del bug de `100vh`). Los tests de layout protegen la geometría (nada queda tapado por la barra), pero la prueba definitiva de ese caso sigue siendo un iPhone real.

## Claude Code + Playwright MCP: dónde encaja

La suite es la red de seguridad **determinista** (corre igual en CI, sin IA, sin costo). Playwright MCP no sustituye eso — se usa *al lado*:

- **Explorar** la app antes de escribir tests ("navega la app y dime qué flujos y casos borde ves").
- **Redactar** un test nuevo a partir de un flujo recorrido en vivo, y luego revisarlo y dejarlo en esta estructura (Page Objects, fixtures).
- **Diagnosticar** un fallo: abrir la traza/screenshot de `test-results/` y proponer el arreglo.

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

## CI

`.github/workflows/e2e.yml` corre typecheck + toda la suite (incluido Safari/WebKit) en cada push y PR, y sube el reporte HTML como artefacto. Requiere `package-lock.json` en el repo (`npm install` lo genera; hay que commitearlo).
