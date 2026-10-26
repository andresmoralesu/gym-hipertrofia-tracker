import type { Page } from '@playwright/test';

export class HistoryPage {
  constructor(private readonly page: Page) {}

  get filter() { return this.page.locator('#exercise-filter'); }
  get rows() { return this.page.locator('#screen-history .history-table tbody tr'); }
  get maxStat() { return this.page.locator('#screen-history .stat-card').nth(0).locator('.stat-value'); }
  get avgStat() { return this.page.locator('#screen-history .stat-card').nth(1).locator('.stat-value'); }

  /** Texto de las celdas de una fila: [fecha, series, peso, notas]. */
  rowCells(i: number) { return this.rows.nth(i).locator('td'); }
  async filterOptions() { return this.filter.locator('option').allInnerTexts().then((t) => t.map((s) => s.trim())); }
}
