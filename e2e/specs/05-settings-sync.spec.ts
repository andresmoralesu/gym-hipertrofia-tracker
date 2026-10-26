import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';

const registro = (id: string, ejercicio: string, peso: number, fecha: string, notas = '') => ({
  id, ejercicio, peso, fecha, series: 3, reps: '10-12', notas,
});

const TRES = [
  registro('a', 'Press Banca', 40, '2026-10-14T15:00:00.000Z'),
  registro('b', 'Press Banca', 50, '2026-10-17T15:00:00.000Z', 'subí peso'),
  registro('c', 'Remo', 35, '2026-10-21T15:00:00.000Z'),
];

test.describe('Settings: sincronización con Google Sheets', () => {
  test('sin datos no envía nada y lo informa', async ({ app, appsScript }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.syncButton.click();

    await app.expectDialog(/Sincronizado.*0 registros/s);
    expect(appsScript.postCount).toBe(0);
  });

  test('envía un POST por registro con los campos que espera el Apps Script', async ({ app, page, appsScript }) => {
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    await app.goTo('settings');

    await app.settings.syncButton.click();

    await app.expectDialog(/Sincronizado.*3 registros guardados/s);
    expect(appsScript.postCount).toBe(3);
    // La hoja recibe los registros en orden cronológico; reps "10-12" llega como 10 (parseFloat del servidor)
    expect(appsScript.sheet).toEqual([
      { fecha: '2026-10-14T15:00:00.000Z', ejercicio: 'Press Banca', peso: 40, series: 3, reps: 10, notas: '' },
      { fecha: '2026-10-17T15:00:00.000Z', ejercicio: 'Press Banca', peso: 50, series: 3, reps: 10, notas: 'subí peso' },
      { fecha: '2026-10-21T15:00:00.000Z', ejercicio: 'Remo', peso: 35, series: 3, reps: 10, notas: '' },
    ]);
  });

  test('el botón se restablece y "Última sincronización" deja de decir "Nunca"', async ({ app, page }) => {
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    await app.goTo('settings');
    await expect(app.settings.lastSync).toHaveText('Nunca');

    await app.settings.syncButton.click();
    await app.expectDialog(/Sincronizado/);
    await expect(app.settings.syncButton).toBeEnabled();
    await expect(app.settings.syncButton).toHaveText('✓ Sincronizar Ahora');

    await app.goTo('history');
    await app.goTo('settings');
    await expect(app.settings.lastSync).not.toHaveText('Nunca');
  });

  test('BUG-04: sincronizar dos veces no debería duplicar filas en la hoja', async ({ app, page, appsScript }) => {
    test.fail(true, 'BUG-04: cada sincronización reenvía TODO el historial y la hoja acumula duplicados');
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    await app.goTo('settings');

    await app.settings.syncButton.click();
    await app.expectDialog(/Sincronizado/);
    await app.settings.syncButton.click();
    await expect.poll(() => appsScript.postCount).toBeGreaterThanOrEqual(6);

    expect(appsScript.sheet).toHaveLength(3);
  });
});

test.describe('Settings: restaurar desde backup (Google Sheets)', () => {
  test('otro dispositivo restaura el historial sincronizado desde la hoja', async ({ app, page, nuevoDispositivo }) => {
    // Dispositivo A: tiene datos y sincroniza
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    await app.goTo('settings');
    await app.settings.syncButton.click();
    await app.expectDialog(/Sincronizado/);

    // Dispositivo B: instalación nueva (IndexedDB vacía), como el iPhone en modo privado
    const b = await nuevoDispositivo();
    await b.open();
    expect(await idb.getAll(b.page, 'historialPesos')).toHaveLength(0);
    await b.goTo('settings');
    await b.settings.restoreButton.click();

    await b.expectDialog(/Restaurado.*3 registros importados/s);
    const restaurados = await idb.getAll(b.page, 'historialPesos');
    expect(restaurados).toHaveLength(3);
    expect(restaurados.map((r) => r.peso).sort()).toEqual([35, 40, 50]);

    await b.goTo('history');
    await expect.poll(() => b.history.filterOptions()).toEqual(['Press Banca', 'Remo']);
    await expect(b.history.rows).toHaveCount(2); // Press Banca
  });

  test('restaurar dos veces no duplica (la segunda importa 0)', async ({ appsScript, nuevoDispositivo }) => {
    appsScript.sheet.push(
      ...TRES.map((r) => ({ fecha: r.fecha, ejercicio: r.ejercicio, peso: r.peso, series: 3, reps: 10, notas: r.notas })),
    );
    const b = await nuevoDispositivo();
    await b.open();
    await b.goTo('settings');

    await b.settings.restoreButton.click();
    await b.expectDialog(/3 registros importados/);
    await b.settings.restoreButton.click();
    await b.expectDialog(/0 registros importados/);

    expect(await idb.getAll(b.page, 'historialPesos')).toHaveLength(3);
  });

  test('si la hoja tiene filas duplicadas (por sincronizaciones repetidas) solo importa las únicas', async ({ appsScript, nuevoDispositivo }) => {
    const fila = { fecha: '2026-10-14T15:00:00.000Z', ejercicio: 'Press Banca', peso: 40, series: 3, reps: 10, notas: '' };
    appsScript.sheet.push(fila, fila, fila, { ...fila, fecha: '2026-10-17T15:00:00.000Z', peso: 50 });
    const b = await nuevoDispositivo();
    await b.open();
    await b.goTo('settings');

    await b.settings.restoreButton.click();

    await b.expectDialog(/2 registros importados/);
    expect(await idb.getAll(b.page, 'historialPesos')).toHaveLength(2);
  });

  test('dos series con mismo peso y distinta hora se conservan como registros distintos', async ({ appsScript, nuevoDispositivo }) => {
    const base = { ejercicio: 'Press Banca', peso: 40, series: 3, reps: 10, notas: '' };
    appsScript.sheet.push(
      { ...base, fecha: '2026-10-21T15:00:01.000Z' },
      { ...base, fecha: '2026-10-21T15:01:30.000Z' },
      { ...base, fecha: '2026-10-21T15:03:10.000Z' },
    );
    const b = await nuevoDispositivo();
    await b.open();
    await b.goTo('settings');

    await b.settings.restoreButton.click();

    await b.expectDialog(/3 registros importados/);
  });

  test('con la hoja vacía avisa que no hay backup', async ({ app }) => {
    await app.open();
    await app.goTo('settings');

    await app.settings.restoreButton.click();

    await app.expectDialog(/No hay backup disponible/);
  });

  test('si el Apps Script no responde, muestra un error de conexión y no importa nada', async ({ app, page, appsScript }) => {
    appsScript.historialCaido = true;
    await app.open();
    await app.goTo('settings');

    await app.settings.restoreButton.click();

    await app.expectDialog(/No se pudo conectar con Google Apps Script/);
    expect(await idb.getAll(page, 'historialPesos')).toHaveLength(0);
  });

  test('cancelar la confirmación no consulta la hoja', async ({ app, appsScript }) => {
    app.confirmAnswer = false;
    await app.open();
    await app.goTo('settings');

    await app.settings.restoreButton.click();

    await expect.poll(() => app.dialogs.length).toBeGreaterThan(0);
    expect(appsScript.getCalls).toHaveLength(0);
  });
});

test.describe('Settings: borrar historial', () => {
  test('cancelar conserva los datos', async ({ app, page }) => {
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    app.confirmAnswer = false;
    await app.goTo('settings');

    await app.settings.clearButton.click();

    await expect.poll(() => app.dialogs.length).toBeGreaterThan(0);
    expect(await idb.getAll(page, 'historialPesos')).toHaveLength(3);
  });

  test('aceptar borra todo el historial', async ({ app, page }) => {
    await app.open();
    await idb.put(page, 'historialPesos', TRES);
    await app.goTo('settings');

    await app.settings.clearButton.click();

    await app.expectDialog(/Historial borrado/);
    expect(await idb.getAll(page, 'historialPesos')).toHaveLength(0);
    await app.goTo('history');
    await expect(app.history.rows).toHaveCount(0);
  });
});
