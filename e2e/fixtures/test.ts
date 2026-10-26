import { test as base, expect, type Browser, type Page } from '@playwright/test';
import { AppPage } from '../pages/AppPage';
import { AppsScriptMock } from './appsScriptMock';
import { AHORA_POR_DEFECTO } from '../support/data';

/**
 * Errores de consola/JS que la app ya emite hoy por cargar en index.html módulos ES
 * (config.js, db.js...) como <script> clásicos. No rompen la app; están documentados
 * en e2e/README.md ("Hallazgos") y se filtran aquí para que el smoke no sea ruidoso.
 * Cualquier error DISTINTO a estos hace fallar el test.
 */
const RUIDO_CONOCIDO = [
  /Unexpected token 'export'/,
  /Cannot use import statement outside a module/,
  /Failed to load resource/, // la consola lo emite por cada request bloqueada/stub
];

export interface ErroresPagina {
  /** Errores JS no capturados. */
  pageErrors: string[];
  /** console.error. */
  consoleErrors: string[];
  /** Requests a hosts externos que ningún mock/stub contempló. */
  requestsExternas: string[];
  inesperados(): string[];
}

type Fixtures = {
  appsScript: AppsScriptMock;
  errores: ErroresPagina;
  app: AppPage;
  /** Abre otro "dispositivo": contexto nuevo con IndexedDB vacía y los mismos mocks. */
  nuevoDispositivo: () => Promise<AppPage>;
};

type Options = {
  /** Fecha/hora "actual" que verá la app (hora de Bogotá). */
  ahora: Date;
};

async function prepararPagina(page: Page, mock: AppsScriptMock, errores: ErroresPagina, ahora: Date) {
  page.on('pageerror', (e) => errores.pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.consoleErrors.push(m.text()); });

  // Reloj controlado: la semana ISO, el día de entrenamiento y las fechas del historial son deterministas.
  await page.clock.install({ time: ahora });

  // OJO: en Playwright gana la ÚLTIMA ruta registrada. Primero el bloqueo general...
  await page.route(/^https?:\/\/(?!localhost)/, (route) => {
    errores.requestsExternas.push(route.request().url());
    return route.abort();
  });
  // ...luego las excepciones específicas.
  // Librerías de Google del <head>: se reemplazan por scripts vacíos (la app no las usa aún).
  await page.route(/^https:\/\/(accounts|apis)\.google\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
  );
  await mock.install(page);
}

function nuevosErrores(): ErroresPagina {
  const e: ErroresPagina = {
    pageErrors: [],
    consoleErrors: [],
    requestsExternas: [],
    inesperados() {
      return [...e.pageErrors, ...e.consoleErrors].filter((msg) => !RUIDO_CONOCIDO.some((re) => re.test(msg)));
    },
  };
  return e;
}

export const test = base.extend<Fixtures & Options>({
  ahora: [AHORA_POR_DEFECTO, { option: true }],

  appsScript: async ({}, use) => {
    await use(new AppsScriptMock());
  },

  errores: async ({}, use) => {
    await use(nuevosErrores());
  },

  app: async ({ page, appsScript, errores, ahora }, use) => {
    await prepararPagina(page, appsScript, errores, ahora);
    await use(new AppPage(page));
  },

  nuevoDispositivo: async ({ browser, appsScript, ahora, baseURL }, use) => {
    const contexts: Awaited<ReturnType<Browser['newContext']>>[] = [];
    await use(async () => {
      const ctx = await browser.newContext({ timezoneId: 'America/Bogota', locale: 'es-CO', baseURL });
      contexts.push(ctx);
      const page = await ctx.newPage();
      await prepararPagina(page, appsScript, nuevosErrores(), ahora);
      return new AppPage(page);
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
});

export { expect };
