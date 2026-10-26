import type { Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('#screen-home');
  get week() { return this.page.locator('#screen-home .variation-card .current'); }
  get badge() { return this.page.locator('#screen-home .variation-badge'); }
  get dateLabel() { return this.page.locator('#screen-home .date-label'); }
  get exercises() { return this.page.locator('#screen-home .exercise-item'); }
  get startButton() { return this.page.locator('#btn-start-workout'); }

  exerciseName(i: number) { return this.exercises.nth(i).locator('.exercise-name'); }
  exerciseDetails(i: number) { return this.exercises.nth(i).locator('.exercise-details'); }
}
