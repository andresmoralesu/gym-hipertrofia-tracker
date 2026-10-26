import { test, expect } from '../fixtures/test';
import { idb } from '../support/idb';
import { DIAS } from '../support/data';

test.describe('Smoke: arranque de la app', () => {
  test('carga e inicializa sin errores inesperados ni requests externas', async ({ app, errores }) => {
    await app.open();

    expect(errores.inesperados(), 'errores de JS/consola').toEqual([]);
    expect(errores.requestsExternas, 'requests a hosts no contemplados').toEqual([]);
  });

  test('muestra las 4 pestañas y arranca en Home', async ({ app }) => {
    await app.open();

    for (const tab of ['home', 'workout', 'history', 'settings'] as const) {
      await expect(app.nav(tab)).toBeVisible();
    }
    await expect(app.nav('home')).toHaveClass(/active/);
    await expect(app.screen('home')).toHaveClass(/active/);
  });

  test('precarga 15 variaciones (3 días × 5) en IndexedDB', async ({ app, page }) => {
    await app.open();

    const variaciones = await idb.getAll(page, 'variaciones');
    expect(variaciones).toHaveLength(15);
    for (const dia of DIAS) {
      const numeros = variaciones.filter((v) => v.diaId === dia).map((v) => v.numeroVariacion).sort();
      expect(numeros, `variaciones de ${dia}`).toEqual([1, 2, 3, 4, 5]);
    }
  });

  test('recargar no duplica las variaciones', async ({ app, page }) => {
    await app.open();
    await app.reload();

    expect(await idb.getAll(page, 'variaciones')).toHaveLength(15);
  });

  test('navegar entre pestañas cambia la pantalla activa', async ({ app }) => {
    await app.open();

    for (const tab of ['history', 'settings', 'home'] as const) {
      await app.goTo(tab);
      await expect(app.nav(tab)).toHaveClass(/active/);
    }
  });
});
