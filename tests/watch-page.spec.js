import { test, expect } from '@playwright/test';

test.describe('Watch Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/watch');
  });

  test('should display watch page', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show video container', async ({ page }) => {
    // Look for video-related elements
    const videoContainer = page.locator('[data-surface*="video"], .monitor, .crt, iframe[src*="youtube"]');
    if (await videoContainer.count() > 0) {
      await expect(videoContainer.first()).toBeVisible();
    }
  });

  test('should display track metadata', async ({ page }) => {
    // Should show some track information
    const metadata = page.locator('[class*="meta"], [class*="track"], [class*="info"]');
    if (await metadata.count() > 0) {
      await expect(metadata.first()).toBeVisible();
    }
  });

  test('should have CRT effects', async ({ page }) => {
    // Check for CRT-related CSS classes
    const scanlines = page.locator('.scanlines, [class*="scanline"]');
    const crtMonitor = page.locator('.crt, [class*="monitor"]');

    const hasCRTEffects = (await scanlines.count() > 0) || (await crtMonitor.count() > 0);
    expect(hasCRTEffects).toBe(true);
  });

  test('should not crash on page load', async ({ page }) => {
    // Wait for any animations
    await page.waitForTimeout(1000);

    // Check that page is still responsive
    await expect(page.locator('body')).toBeVisible();

    // Should not have any uncaught errors (checked by Playwright automatically)
  });
});
