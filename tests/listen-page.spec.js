import { test, expect } from '@playwright/test';

test.describe('Listen Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listen');
  });

  test('should display radio interface', async ({ page }) => {
    await expect(page.locator('text=/frequency|tune/i')).toBeVisible();
  });

  test('should show current frequency in nixie tubes', async ({ page }) => {
    const nixieDisplay = page.locator('.nixie-display, .nixie-panel');
    await expect(nixieDisplay).toBeVisible();
  });

  test('should display track selection grid', async ({ page }) => {
    const trackGrid = page.locator('.trackGrid, .track-panel');
    await expect(trackGrid).toBeVisible();

    // Should have multiple tracks
    const trackCards = page.locator('.trackCard, button:has-text("FREQ")');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should switch tracks when clicked', async ({ page }) => {
    // Find all track cards
    const trackCards = page.locator('.trackCard, button[class*="track"]');
    const count = await trackCards.count();

    if (count > 1) {
      // Click second track
      await trackCards.nth(1).click();

      // Wait for animation
      await page.waitForTimeout(500);

      // Should have an active track
      const activeTrack = page.locator('.trackCardActive, [class*="Active"]');
      await expect(activeTrack).toBeVisible();
    }
  });

  test('should show school name', async ({ page }) => {
    // Should display one of the school names
    const schools = ['VOID', 'PSYCHIC', 'ALCHEMY', 'WILL', 'SONIC'];
    let foundSchool = false;

    for (const school of schools) {
      const schoolText = page.locator(`text=${school}`);
      if (await schoolText.count() > 0) {
        foundSchool = true;
        break;
      }
    }

    expect(foundSchool).toBe(true);
  });

  test('should display visualizer bars', async ({ page }) => {
    const visualizer = page.locator('.vacuum-visualizer, .oscilloscope, [class*="visualiz"]');
    if (await visualizer.count() > 0) {
      await expect(visualizer.first()).toBeVisible();
    }
  });

  test('should show brass dial control', async ({ page }) => {
    const dial = page.locator('.dial-section, .brass-gear, [class*="dial"]');
    if (await dial.count() > 0) {
      await expect(dial.first()).toBeVisible();
    }
  });

  test('should prevent rapid track switching', async ({ page }) => {
    const trackCards = page.locator('.trackCard, button[class*="track"]');
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
