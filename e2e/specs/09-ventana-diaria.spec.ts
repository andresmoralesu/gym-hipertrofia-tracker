import { test, expect } from '../fixtures/test';
import { variacion } from '../support/data';

/**
 * La rutina de cada día de entrenamiento dura de 0:00:00 a 23:59:30 (hora de Bogotá).
 * Martes = Pierna, miércoles = Pecho/Tríceps/Hombro, viernes = Espalda/Bíceps.
 * Semana 3 del programa = lun 9 → dom 15 nov 2026 (variación 3); desde el lunes 16 es la semana 4 (variación 4).
 */
const hora = (iso: string) => new Date(`${iso}-05:00`);

// Nota: el reloj de la página corre en tiempo real. Los casos de "fin del día" parten de 23:59:30 (y no de
// 23:59:59) para que una máquina lenta no cruce la medianoche en mitad del test. El último segundo exacto
// se prueba como lógica pura en 08-iso-week.spec.ts.

const BORDES = [
  { nombre: 'martes 00:00:00',    cuando: '2026-11-10T00:00:00', dia: 'martes',    semana: 3, v: 3 },
  { nombre: 'martes 23:59:30',    cuando: '2026-11-10T23:59:30', dia: 'martes',    semana: 3, v: 3 },
  { nombre: 'miércoles 00:00:00', cuando: '2026-11-11T00:00:00', dia: 'miercoles', semana: 3, v: 3 },
  { nombre: 'miércoles 23:59:30', cuando: '2026-11-11T23:59:30', dia: 'miercoles', semana: 3, v: 3 },
  { nombre: 'jueves 00:00:00',    cuando: '2026-11-12T00:00:00', dia: 'viernes',   semana: 3, v: 3 },
  { nombre: 'viernes 00:00:00',   cuando: '2026-11-13T00:00:00', dia: 'viernes',   semana: 3, v: 3 },
  { nombre: 'viernes 23:59:30',   cuando: '2026-11-13T23:59:30', dia: 'viernes',   semana: 3, v: 3 },
  { nombre: 'sábado 00:00:00',    cuando: '2026-11-14T00:00:00', dia: 'martes',    semana: 4, v: 4 },
  { nombre: 'domingo 23:59:30',   cuando: '2026-11-15T23:59:30', dia: 'martes',    semana: 4, v: 4 },
  { nombre: 'lunes 00:00:00',     cuando: '2026-11-16T00:00:00', dia: 'martes',    semana: 4, v: 4 },
  { nombre: 'lunes 23:59:30',     cuando: '2026-11-16T23:59:30', dia: 'martes',    semana: 4, v: 4 },
] as const;

test.describe('Ventana de 24 horas por rutina: bordes de medianoche', () => {
  for (const c of BORDES) {
    test.describe(c.nombre, () => {
      test.use({ ahora: hora(c.cuando) });

      test(`muestra ${c.dia}, semana ${c.semana}`, async ({ app }) => {
        await app.open();
        await expect(app.home.week).toHaveText(`Semana ${c.semana}`);
        const esperados = variacion(c.dia, c.v).ejercicios;
        await expect(app.home.exercises).toHaveCount(esperados.length);
        await expect(app.home.exerciseName(0)).toHaveText(esperados[0].nombre);
      });
    });
  }
});

test.describe('Cambio de día con la app abierta', () => {
  test.use({ ahora: hora('2026-11-13T23:59:50') }); // viernes, 10 s antes de la medianoche

  test('a las 0:00 la app se refresca y pasa a la rutina del siguiente día', async ({ app, page }) => {
    await app.open();
    await expect(app.home.exerciseName(0)).toHaveText(variacion('viernes', 3).ejercicios[0].nombre);

    await page.clock.fastForward(30_000); // cruza la medianoche → sábado
    await expect(app.home.week).toHaveText('Semana 4', { timeout: 15_000 });
    await expect(app.home.exerciseName(0)).toHaveText(variacion('martes', 4).ejercicios[0].nombre);
  });

  test('al volver de segundo plano al día siguiente se recarga la rutina', async ({ app, page }) => {
    await app.open();
    await page.clock.setSystemTime(hora('2026-11-14T08:00:00')); // el reloj saltó sin que corriera el temporizador
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

    await expect(app.home.week).toHaveText('Semana 4', { timeout: 15_000 });
    await expect(app.home.exerciseName(0)).toHaveText(variacion('martes', 4).ejercicios[0].nombre);
  });
});

test.describe('Sin cambio de día no se recarga', () => {
  test.use({ ahora: hora('2026-11-13T10:00:00') });

  test('pasar horas el mismo día no recarga la página', async ({ app, page }) => {
    await app.open();
    await page.evaluate(() => { (window as any).__marca = 'sigo-aqui'; });

    await page.clock.setSystemTime(hora('2026-11-13T22:00:00'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => (window as any).__marca)).toBe('sigo-aqui');
    await expect(app.home.week).toHaveText('Semana 3');
  });
});
