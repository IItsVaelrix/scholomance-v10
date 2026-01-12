import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to Watch page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(watch)?$/);
    await expect(page.locator('h1')).toContainText(/ritual ui/i);
  });

  test('should navigate to Listen page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Listen' }).click();
    await expect(page).toHaveURL(/\/listen/);
    await expect(page.getByRole('heading', { name: /tune the school/i })).toBeVisible();
  });

  test('should navigate to Read page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Read' }).click();
    await expect(page).toHaveURL(/\/read/);
    await expect(page.locator('#scroll-title')).toBeVisible();
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
