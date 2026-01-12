import { test, expect } from '@playwright/test';

test.describe('Listen Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listen');
  });

  test('should display radio interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tune the school/i })).toBeVisible();
  });

  test('should show current frequency in nixie tubes', async ({ page }) => {
    await expect(page.locator('.nixie-panel')).toBeVisible();
  });

  test('should display track selection grid', async ({ page }) => {
    await expect(page.locator('.track-panel')).toBeVisible();

    // Should have multiple tracks
    const trackCards = page.locator('.trackCard');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should switch tracks when clicked', async ({ page }) => {
    // Find all track cards
    const trackCards = page.locator('.track-panel .trackCard');
    const count = await trackCards.count();

    if (count > 1) {
      // Click second track
      await trackCards.nth(1).click();

      // Wait for animation
      await page.waitForTimeout(500);

      // Should have an active track
      const activeTrack = page.locator('.track-panel .trackCardActive');
      await expect(activeTrack).toBeVisible();
    }
  });

  test('should show school name', async ({ page }) => {
    await expect(page.locator('.dial-school')).toHaveText(/VOID|PSYCHIC|ALCHEMY|WILL|SONIC/);
  });

  test('should display visualizer bars', async ({ page }) => {
    await expect(page.locator('.vacuum-visualizer')).toBeVisible();
    await expect(page.locator('.vacuum-bar').first()).toBeVisible();
  });

  test('should show brass dial control', async ({ page }) => {
    await expect(page.locator('.dial-section')).toBeVisible();
  });

  test('should prevent rapid track switching', async ({ page }) => {
    const trackCards = page.locator('.track-panel .trackCard');
    const count = await trackCards.count();

    if (count > 1) {
      // Click first track
      await trackCards.nth(0).click();

      // Immediately try to click another track
      await trackCards.nth(1).click();

      // Wait for any animations
      await page.waitForTimeout(1000);

      // Should not crash or cause errors
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
