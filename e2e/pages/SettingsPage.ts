import type { Page } from '@playwright/test';

export class SettingsPage {
  constructor(private readonly page: Page) {}

  get syncButton() { return this.page.locator('#btn-sync-now'); }
  get restoreButton() { return this.page.locator('#btn-restore-data'); }
  get generateButton() { return this.page.locator('#btn-generar-variaciones'); }
  get clearButton() { return this.page.locator('#btn-clear-data'); }
  get lastSync() { return this.page.locator('#screen-settings .settings-item', { hasText: 'Última sincronización' }).locator('.value'); }
  get statusBadge() { return this.page.locator('#screen-settings .status-badge'); }
}
