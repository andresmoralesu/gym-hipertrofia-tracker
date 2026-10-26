import { test, expect } from '../fixtures/test';

// Ruta del módulo dentro de la página (variable: así TypeScript no intenta resolverla).
const MODULO = '/scripts/skills/variaciones.js';

/**
 * Lógica pura de calendario (scripts/skills/variaciones.js), ejecutada dentro de la página
 * con import dinámico. Es la lógica que decide QUÉ entrenamiento toca, así que se prueba
 * con fechas límite (inicio del programa, domingo/lunes, cambio de año, más de 52 semanas).
 */
test.describe('Semanas del programa y ciclo de variaciones', () => {
  test.beforeEach(async ({ app }) => {
    await app.open();
  });

  test('calcularNumeroDeSemana: la semana 1 empieza el lunes 26-oct-2026 y cada semana va de lunes a domingo', async ({ page }) => {
    const casos: [string, number][] = [
      ['2026-10-19', 1],   // antes del inicio: se muestra la semana 1
      ['2026-10-25', 1],   // domingo anterior al inicio
      ['2026-10-26', 1],   // lunes: INICIO del programa
      ['2026-10-27', 1],   // martes: primer entrenamiento
      ['2026-10-30', 1],   // viernes
      ['2026-11-01', 1],   // domingo: último día de la semana 1
      ['2026-11-02', 2],   // lunes: empieza la semana 2
      ['2026-11-09', 3],
      ['2026-11-15', 3],   // domingo
      ['2026-11-16', 4],
      ['2026-11-30', 6],   // lunes: semana 6
      ['2026-12-28', 10],
      ['2027-01-04', 11],  // cambio de año: sigue contando
      ['2027-10-25', 53],  // pasa de 52: sin tope
    ];

    const obtenido = await page.evaluate(async ({ casos, MODULO }) => {
      const { calcularNumeroDeSemana } = await import(MODULO);
      return casos.map(([iso]) => {
        const [y, m, d] = iso.split('-').map(Number);
        return [iso, calcularNumeroDeSemana(new Date(y, m - 1, d))];
      });
    }, { casos, MODULO });

    expect(obtenido).toEqual(casos);
  });

  test('calcularNumeroDeSemana: el último segundo del domingo sigue en la semana, el lunes 0:00 cambia', async ({ page }) => {
    const r = await page.evaluate(async (MODULO) => {
      const { calcularNumeroDeSemana } = await import(MODULO);
      return [
        calcularNumeroDeSemana(new Date(2026, 10, 1, 23, 59, 59)),  // domingo 1-nov
        calcularNumeroDeSemana(new Date(2026, 10, 2, 0, 0, 0)),     // lunes 2-nov
      ];
    }, MODULO);
    expect(r).toEqual([1, 2]);
  });

  test('mapearVariacionDeSemana cicla 1-5 sin tope y rechaza semanas inválidas', async ({ page }) => {
    const r = await page.evaluate(async (MODULO) => {
      const { mapearVariacionDeSemana } = await import(MODULO);
      const ciclo = [1, 2, 3, 4, 5, 6, 7, 10, 11, 52, 53, 54].map((s) => [s, mapearVariacionDeSemana(s)]);
      const rechazos = [0, -1, 1.5].map((s) => {
        try { mapearVariacionDeSemana(s); return 'no lanzó'; } catch (e) { return (e as Error).message; }
      });
      return { ciclo, rechazos };
    }, MODULO);

    expect(r.ciclo).toEqual([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 1], [7, 2], [10, 5], [11, 1], [52, 2], [53, 3], [54, 4]]);
    expect(r.rechazos).toEqual(['Número de semana inválido: 0', 'Número de semana inválido: -1', 'Número de semana inválido: 1.5']);
  });

  test('obtenerProximoDia: un día de entrenamiento devuelve HOY; un día de descanso, el siguiente', async ({ page }) => {
    // Semana lun 9 → dom 15 nov 2026
    const esperado = [
      ['lunes', 'martes', 1], ['martes', 'martes', 0], ['miércoles', 'miercoles', 0], ['jueves', 'viernes', 1],
      ['viernes', 'viernes', 0], ['sábado', 'martes', 3], ['domingo', 'martes', 2],
    ];

    const obtenido = await page.evaluate(async (MODULO) => {
      const { obtenerProximoDia } = await import(MODULO);
      const nombres = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      return nombres.map((n, i) => {
        const r = obtenerProximoDia(new Date(2026, 10, 9 + i));
        return [n, r.diaId, r.diasAlProximo];
      });
    }, MODULO);

    expect(obtenido).toEqual(esperado);
  });

  test('obtenerProximoDia: el último segundo del día sigue siendo HOY y a las 0:00 pasa al siguiente', async ({ page }) => {
    const r = await page.evaluate(async (MODULO) => {
      const { obtenerProximoDia } = await import(MODULO);
      const f = (d: Date) => { const x = obtenerProximoDia(d); return [x.diaId, x.diasAlProximo]; };
      return [
        f(new Date(2026, 10, 13, 0, 0, 0)),    // viernes 0:00:00
        f(new Date(2026, 10, 13, 23, 59, 59)), // viernes 23:59:59
        f(new Date(2026, 10, 14, 0, 0, 0)),    // sábado 0:00:00 → martes
        f(new Date(2026, 10, 10, 23, 59, 59)), // martes 23:59:59
        f(new Date(2026, 10, 11, 0, 0, 0)),    // miércoles 0:00:00
      ];
    }, MODULO);
    expect(r).toEqual([['viernes', 0], ['viernes', 0], ['martes', 3], ['martes', 0], ['miercoles', 0]]);
  });

  test('esHoyEntrenamiento detecta solo martes, miércoles y viernes', async ({ page }) => {
    const obtenido = await page.evaluate(async (MODULO) => {
      const { esHoyEntrenamiento } = await import(MODULO);
      return [0, 1, 2, 3, 4, 5, 6].map((i) => esHoyEntrenamiento(new Date(2026, 10, 9 + i)));
    }, MODULO);

    // lun 9 … dom 15 nov 2026
    expect(obtenido).toEqual([null, 'martes', 'miercoles', null, 'viernes', null, null]);
  });
});
