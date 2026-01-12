import { test, expect } from '@playwright/test';

/*
This file is a starting point for Visual Regression Testing.
Playwright can compare screenshots of your application's pages and components
to ensure that they have not changed unexpectedly.

How it works:
1. The first time you run a test with `toHaveScreenshot()`, it will generate a "golden" or "snapshot" image.
   You need to commit this image to your repository.
2. On subsequent runs, Playwright will take a new screenshot and compare it to the golden image.
3. If the new screenshot is different, the test will fail.

To run these tests:
- By default, Playwright does not run tests with ".spec.js" in their name that are not in the root tests directory.
  You may need to update your playwright.config.js to include this file.
- To update the golden images, run: `npx playwright test --update-snapshots`
*/

test.describe('Visual Regression', () => {
  test('should match the golden snapshot for the main page', async ({ page }) => {
    await page.goto('/');

    // This will take a screenshot of the entire page and compare it to a previously stored snapshot.
    // The first time you run this test, it will create the snapshot.
    await expect(page).toHaveScreenshot('main-page.png');
  });

  test('should match the golden snapshot for the listen page', async ({ page }) => {
    await page.goto('/listen');
    await expect(page).toHaveScreenshot('listen-page.png');
  });

  test('should match the golden snapshot for the read page', async ({ page }) => {
    await page.goto('/read');
    await expect(page).toHaveScreenshot('read-page.png');
  });
});
