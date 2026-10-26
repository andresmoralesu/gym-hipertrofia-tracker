import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import type { Tab } from '../pages/AppPage';

/**
 * Regresión del bug de iPhone: los botones del final de cada pantalla (Comenzar Entrenamiento,
 * Borrar Historial) quedaban fuera de alcance. Se ejecuta SOLO en los proyectos móviles
 * (iPhone 14 emulado sobre Chromium y, con WEBKIT=1, Safari real).
 */
const TABS: Tab[] = ['home', 'workout', 'history', 'settings'];

async function irAlFinal(page: Page) {
  await page.evaluate(() => {
    const s = document.querySelector<HTMLElement>('.screen.active')!;
    s.scrollTop = s.scrollHeight;
  });
}

async function cajas(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav')!.getBoundingClientRect();
    const screen = document.querySelector('.screen.active')!.getBoundingClientRect();
    return {
      navTop: nav.top, navBottom: nav.bottom, navHeight: nav.height,
      screenBottom: screen.bottom,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

test.describe('Layout móvil', () => {
  test.beforeEach(async ({ app }) => {
    await app.open();
  });

  test('la barra de navegación queda pegada al borde inferior de la pantalla visible', async ({ page }) => {
    const c = await cajas(page);

    expect(c.navBottom).toBeCloseTo(c.viewportHeight, 0);
    expect(c.navHeight).toBeGreaterThanOrEqual(60);
  });

  for (const tab of TABS) {
    test(`${tab}: sin scroll horizontal y el contenido termina donde empieza la barra`, async ({ app, page }) => {
      if (tab === 'workout') await app.startWorkout();
      else await app.goTo(tab);

      const c = await cajas(page);

      expect(c.scrollWidth, 'scroll horizontal').toBeLessThanOrEqual(c.viewportWidth);
      expect(c.screenBottom, 'la pantalla no debe quedar debajo de la barra').toBeLessThanOrEqual(c.navTop + 1);
    });
  }

  test('Home: "Comenzar Entrenamiento" se alcanza haciendo scroll y se puede tocar', async ({ app, page }) => {
    await irAlFinal(page);
    const caja = await app.home.startButton.boundingBox();
    const { navTop } = await cajas(page);

    expect(caja!.y + caja!.height).toBeLessThanOrEqual(navTop + 1); // 1 px de tolerancia (subpíxeles)
    // click() verifica además que ningún otro elemento (la barra) tape el botón
    await app.home.startButton.click();
    await expect(app.workout.counter).toBeVisible();
  });

  test('Settings: "Borrar Historial" (último botón) se alcanza y se puede tocar', async ({ app, page }) => {
    app.confirmAnswer = false; // solo comprobamos que el tap llega; no borrar nada
    await app.goTo('settings');
    await expect(app.settings.clearButton).toBeVisible(); // Settings se dibuja de forma asíncrona: esperar antes de hacer scroll
    await irAlFinal(page);
    const caja = await app.settings.clearButton.boundingBox();
    const { navTop } = await cajas(page);

    expect(caja!.y + caja!.height).toBeLessThanOrEqual(navTop + 1); // 1 px de tolerancia (subpíxeles)
    await app.settings.clearButton.click();
    await expect.poll(() => app.dialogs.length).toBeGreaterThan(0);
  });

  test('Settings: "Generar Variaciones" y "Restaurar" son tocables sin que la barra los tape', async ({ app, page }) => {
    app.confirmAnswer = false;
    await app.goTo('settings');

    for (const boton of [app.settings.restoreButton, app.settings.generateButton]) {
      await boton.scrollIntoViewIfNeeded();
      const caja = await boton.boundingBox();
      const { navTop } = await cajas(page);
      expect(caja!.y + caja!.height).toBeLessThanOrEqual(navTop + 1); // 1 px de tolerancia (subpíxeles)
    }
  });

  test('Workout: "Serie OK", "Saltar" y el próximo ejercicio son alcanzables', async ({ app, page }) => {
    await app.startWorkout();
    await irAlFinal(page);
    const { navTop } = await cajas(page);

    for (const el of [app.workout.okButton, app.workout.skipButton, app.workout.nextExercise]) {
      const caja = await el.boundingBox();
      expect(caja!.y + caja!.height).toBeLessThanOrEqual(navTop + 1); // 1 px de tolerancia (subpíxeles)
    }
    await app.workout.completeSet(40); // el flujo real funciona con el teclado/tap móvil
    await expect(app.workout.counter).toHaveText('2 / 3');
  });
});
