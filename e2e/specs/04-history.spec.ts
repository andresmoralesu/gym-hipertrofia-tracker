import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';
import { variacion } from '../support/data';

const registro = (id: string, ejercicio: string, peso: number, fecha: string, notas = '') => ({
  id, ejercicio, peso, fecha, series: 3, reps: '10-12', notas,
});

test.describe('History', () => {
  test('sin datos: lista vacía y estadísticas en "—"', async ({ app }) => {
    await app.open();
    await app.goTo('history');

    await expect.poll(() => app.history.filterOptions()).toEqual([]);
    await expect(app.history.rows).toHaveCount(0);
    await expect(app.history.maxStat).toHaveText('— kg');
    await expect(app.history.avgStat).toHaveText('— kg');
  });

  test('con datos: filas por fecha descendente, notas, fecha "DD Mon" y estadísticas', async ({ app, page }) => {
    await app.open();
    await idb.put(page, 'historialPesos', [
      registro('a', 'Press Banca', 40, '2026-10-14T15:00:00.000Z'),
      registro('b', 'Press Banca', 50, '2026-10-21T15:00:00.000Z', 'subí peso'),
      registro('c', 'Press Banca', 45, '2026-10-17T15:00:00.000Z'),
    ]);
    await app.reload();
    await app.goTo('history');

    await expect(app.history.rows).toHaveCount(3);
    // más reciente primero
    await expect(app.history.rowCells(0)).toHaveText(['21 Oct', '3', '50 kg', 'subí peso']);
    await expect(app.history.rowCells(1)).toHaveText(['17 Oct', '3', '45 kg', '']);
    await expect(app.history.rowCells(2)).toHaveText(['14 Oct', '3', '40 kg', '']);
    await expect(app.history.maxStat).toHaveText('50 kg');
    await expect(app.history.avgStat).toHaveText('45.0 kg');
  });

  test('el filtro lista los ejercicios por cantidad de registros y recalcula al cambiar', async ({ app, page }) => {
    await app.open();
    await idb.put(page, 'historialPesos', [
      registro('a', 'Sentadilla', 80, '2026-10-14T15:00:00.000Z'),
      registro('b', 'Press Banca', 40, '2026-10-15T15:00:00.000Z'),
      registro('c', 'Press Banca', 60, '2026-10-16T15:00:00.000Z'),
      registro('d', 'Press Banca', 50, '2026-10-17T15:00:00.000Z'),
    ]);
    await app.reload();
    await app.goTo('history');

    // Press Banca (3) antes que Sentadilla (1); arranca con el primero
    await expect.poll(() => app.history.filterOptions()).toEqual(['Press Banca', 'Sentadilla']);
    await expect(app.history.rows).toHaveCount(3);
    await expect(app.history.maxStat).toHaveText('60 kg');

    await app.history.filter.selectOption('Sentadilla');

    await expect(app.history.rows).toHaveCount(1);
    await expect(app.history.maxStat).toHaveText('80 kg');
    await expect(app.history.avgStat).toHaveText('80.0 kg');
  });

  test('muestra solo los últimos 20 registros del ejercicio', async ({ app, page }) => {
    await app.open();
    const muchos = Array.from({ length: 25 }, (_, i) =>
      registro(`r${i}`, 'Remo', 30 + i, new Date(Date.UTC(2026, 8, 1 + i, 15)).toISOString()),
    );
    await idb.put(page, 'historialPesos', muchos);
    await app.reload();
    await app.goTo('history');

    await expect(app.history.rows).toHaveCount(20);
    await expect(app.history.rowCells(0).nth(2)).toHaveText('54 kg'); // el más reciente (i=24)
  });

  test('integración Workout → History: lo registrado en el entrenamiento aparece en el historial', async ({ app }) => {
    const primero = variacion('viernes', 3).ejercicios[0];
    await app.open();
    await app.startWorkout();
    await app.workout.completeSet(40, 'calentamiento');
    await expect(app.workout.counter).toHaveText('2 / 3');
    await app.workout.completeSet(50);
    await expect(app.workout.counter).toHaveText('3 / 3');

    await app.goTo('history');

    await expect.poll(() => app.history.filterOptions()).toEqual([primero.nombre]);
    await expect(app.history.rows).toHaveCount(2);
    await expect(app.history.maxStat).toHaveText('50 kg');
    await expect(app.history.avgStat).toHaveText('45.0 kg');
    await expect(app.history.rows.filter({ hasText: 'calentamiento' })).toHaveCount(1);
  });
});
