import { expect, type Page } from '@playwright/test';

export class WorkoutPage {
  constructor(private readonly page: Page) {}

  get currentExercise() { return this.page.locator('#screen-workout .current-exercise').first().locator('.exercise-name'); }
  get nextExercise() { return this.page.locator('#screen-workout .current-exercise').nth(1).locator('.exercise-name'); }
  get counter() { return this.page.locator('#set-counter'); }
  get timer() { return this.page.locator('#timer'); }
  get weightInput() { return this.page.locator('#weight-input'); }
  get notesInput() { return this.page.locator('#notes-input'); }
  get okButton() { return this.page.locator('#btn-set-ok'); }
  get skipButton() { return this.page.locator('#btn-skip'); }

  get modal() { return this.page.locator('.modal-overlay'); }
  get modalNextButton() { return this.page.locator('#btn-next-exercise'); }
  get modalHomeButton() { return this.page.locator('#btn-home'); }
  get screenContent() { return this.page.locator('#screen-workout'); }

  /** Registra una serie: peso + nota opcional + "Serie OK". */
  async completeSet(peso: number | string, nota?: string) {
    await this.weightInput.fill(String(peso));
    if (nota !== undefined) await this.notesInput.fill(nota);
    await this.okButton.click();
  }

  /** Registra todas las series de un ejercicio (la última abre el modal). */
  async completeExercise(series: number, peso = 40) {
    for (let i = 0; i < series; i++) {
      await this.completeSet(peso);
      if (i < series - 1) await expect(this.counter).toHaveText(`${i + 2} / ${series}`);
    }
    await expect(this.modal).toBeVisible();
  }
}
