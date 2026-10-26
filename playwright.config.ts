import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Solo para entornos donde Chromium ya viene instalado en otra ruta (no es necesario en tu máquina).
const launchOptions = process.env.PW_CHROMIUM_PATH
  ? { executablePath: process.env.PW_CHROMIUM_PATH }
  : {};

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-CO',
    timezoneId: 'America/Bogota', // las fechas de la app dependen de la zona horaria
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // App estática: se sirve tal cual, sin build. -c-1 desactiva la caché.
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1 --silent`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /07-mobile-layout/,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
    {
      // Emulación de iPhone 14 sobre Chromium: corre en cualquier máquina.
      name: 'iphone-14-chromium',
      testMatch: /(01-smoke|03-workout|07-mobile-layout)/,
      use: { ...devices['iPhone 14'], defaultBrowserType: 'chromium', launchOptions },
    },
    // Safari real (WebKit). Se activa con WEBKIT=1 (requiere: npx playwright install webkit).
    ...(process.env.WEBKIT
      ? [
          {
            name: 'iphone-14-safari',
            testMatch: /(01-smoke|03-workout|07-mobile-layout)/,
            use: { ...devices['iPhone 14'] },
          },
        ]
      : []),
  ],
});
