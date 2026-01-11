import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to Watch page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(watch)?$/);
    await expect(page.locator('h1')).toContainText(/watch|monitor/i);
  });

  test('should navigate to Listen page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Listen');
    await expect(page).toHaveURL(/\/listen/);
    await expect(page.locator('h1')).toContainText(/tune|frequency/i);
  });

  test('should navigate to Read page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Read');
    await expect(page).toHaveURL(/\/read/);
    await expect(page.locator('h1')).toContainText(/scribe|analyze/i);
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/listen');
    const activeLink = page.locator('nav a.navLinkActive');
    await expect(activeLink).toContainText('Listen');
  });

  test('should show navigation pill on active section', async ({ page }) => {
    await page.goto('/watch');
    await expect(page.locator('.navPill')).toBeVisible();
  });
});
