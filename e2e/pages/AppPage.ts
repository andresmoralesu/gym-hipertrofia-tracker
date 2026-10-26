import { expect, type Page } from '@playwright/test';
import { HomePage } from './HomePage';
import { WorkoutPage } from './WorkoutPage';
import { HistoryPage } from './HistoryPage';
import { SettingsPage } from './SettingsPage';

export type Tab = 'home' | 'workout' | 'history' | 'settings';

export interface DialogInfo {
  type: string;
  message: string;
}

/**
 * Punto de entrada de la app: navegación, arranque y manejo de diálogos nativos
 * (alert/confirm). Los diálogos se aceptan automáticamente y quedan registrados.
 */
export class AppPage {
  readonly home: HomePage;
  readonly workout: WorkoutPage;
  readonly history: HistoryPage;
  readonly settings: SettingsPage;

  /** Diálogos que la app mostró, en orden. */
  readonly dialogs: DialogInfo[] = [];
  /** Respuesta a los confirm(): true = Aceptar, false = Cancelar. */
  confirmAnswer = true;

  constructor(readonly page: Page) {
    this.home = new HomePage(page);
    this.workout = new WorkoutPage(page);
    this.history = new HistoryPage(page);
    this.settings = new SettingsPage(page);

    page.on('dialog', async (dialog) => {
      this.dialogs.push({ type: dialog.type(), message: dialog.message() });
      if (dialog.type() === 'confirm' && !this.confirmAnswer) await dialog.dismiss();
      else await dialog.accept();
    });
  }

  async open() {
    await this.page.goto('/index.html');
    await this.waitReady();
  }

  async reload() {
    await this.page.reload();
    await this.waitReady();
  }

  /** La app marca APP.inicializado = true cuando terminó toda su inicialización. */
  async waitReady() {
    await this.page.waitForFunction(() => (window as any).APP?.inicializado === true);
    await expect(this.page.locator('.bottom-nav')).toBeVisible();
  }

  nav(tab: Tab) {
    return this.page.locator(`.nav-item[data-tab="${tab}"]`);
  }

  screen(tab: Tab) {
    return this.page.locator(`#screen-${tab}`);
  }

  async goTo(tab: Tab) {
    await this.nav(tab).click();
    await expect(this.screen(tab)).toHaveClass(/active/);
  }

  /** Home → "Comenzar Entrenamiento": es el camino que sí construye la pantalla Workout. */
  async startWorkout() {
    await this.home.startButton.click();
    await expect(this.workout.counter).toBeVisible();
  }

  lastDialog(): DialogInfo | undefined {
    return this.dialogs[this.dialogs.length - 1];
  }

  /** Espera a que aparezca un diálogo cuyo mensaje cumpla el patrón. */
  async expectDialog(pattern: RegExp) {
    await expect.poll(() => this.dialogs.some((d) => pattern.test(d.message))).toBe(true);
  }
}
