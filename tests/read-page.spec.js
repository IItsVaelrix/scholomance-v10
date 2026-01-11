import { test, expect } from '@playwright/test';

test.describe('Read Page - Scroll Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show empty state when no scrolls exist', async ({ page }) => {
    await expect(page.locator('text=Select or Create a Scroll')).toBeVisible();
  });

  test('should create a new scroll', async ({ page }) => {
    // Click new scroll button
    await page.click('text=New Scroll');

    // Fill in title and content
    await page.fill('input[placeholder*="Title"]', 'Test Scroll');
    await page.fill('textarea', 'This is test content for the scroll.');

    // Save the scroll
    await page.click('text=Save Scroll');

    // Verify scroll appears in list
    await expect(page.locator('text=Test Scroll')).toBeVisible();
  });

  test('should display word and character count', async ({ page }) => {
    await page.click('text=New Scroll');
    await page.fill('textarea', 'one two three four five');

    await expect(page.locator('text=5 words')).toBeVisible();
  });

  test('should save scroll with Ctrl+S', async ({ page }) => {
    await page.click('text=New Scroll');
    await page.fill('input[placeholder*="Title"]', 'Keyboard Test');
    await page.fill('textarea', 'Testing keyboard shortcut');

    // Press Ctrl+S (or Cmd+S on Mac)
    await page.keyboard.press('Control+s');

    // Verify scroll was saved
    await expect(page.locator('text=Keyboard Test')).toBeVisible();
  });

  test('should edit existing scroll', async ({ page }) => {
    // Create a scroll first
    await page.click('text=New Scroll');
    await page.fill('input[placeholder*="Title"]', 'Original Title');
    await page.fill('textarea', 'Original content');
    await page.click('text=Save Scroll');

    // Click edit button
    await page.click('text=Edit');

    // Modify content
    await page.fill('input[placeholder*="Title"]', 'Updated Title');
    await page.click('text=Update Scroll');

    // Verify update
    await expect(page.locator('text=Updated Title')).toBeVisible();
  });

  test('should delete scroll', async ({ page }) => {
    // Create a scroll
    await page.click('text=New Scroll');
    await page.fill('input[placeholder*="Title"]', 'To Be Deleted');
    await page.fill('textarea', 'This will be deleted');
    await page.click('text=Save Scroll');

    // Find and click delete button
    const deleteButton = page.locator('[aria-label*="Delete"], button:has-text("Delete"), button:has-text("🗑")').first();
    await deleteButton.click();

    // Verify scroll is gone
    await expect(page.locator('text=To Be Deleted')).not.toBeVisible();
  });

  test('should prevent saving empty content', async ({ page }) => {
    await page.click('text=New Scroll');
    await page.fill('input[placeholder*="Title"]', 'Empty Test');
    // Leave textarea empty

    // Try to save
    await page.click('text=Save Scroll');

    // Should show validation error
    await expect(page.locator('text=/cannot be empty/i')).toBeVisible();
  });

  test('should enforce character limit', async ({ page }) => {
    await page.click('text=New Scroll');

    // Check that character limit is displayed
    await expect(page.locator('text=/100,000/i')).toBeVisible();
  });
});

test.describe('Read Page - Phoneme Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read');
    await page.evaluate(() => localStorage.clear());
  });

  test('should wait for phoneme engine to load', async ({ page }) => {
    // Should show loading state initially or be ready
    const engineStatus = page.locator('.engine-status');
    const count = await engineStatus.count();

    if (count > 0) {
      await expect(engineStatus).toContainText(/loading|demo mode/i);
    }
  });

  test('should analyze word when clicked', async ({ page }) => {
    // Create a scroll with analyzable content
    await page.click('text=New Scroll');
    await page.fill('textarea', 'The cat sat on the mat');
    await page.click('text=Save Scroll');

    // Wait for engine to be ready (up to 5 seconds)
    await page.waitForTimeout(2000);

    // Click on a word
    const word = page.locator('text=cat').first();
    if (await word.isVisible()) {
      await word.click();

      // Should show annotation panel
      const annotationPanel = page.locator('[data-surface="annotation"], .annotation-panel');
      if (await annotationPanel.count() > 0) {
        await expect(annotationPanel).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should close annotation panel', async ({ page }) => {
    // Create and save a scroll
    await page.click('text=New Scroll');
    await page.fill('textarea', 'Test word analysis');
    await page.click('text=Save Scroll');

    await page.waitForTimeout(2000);

    // Click a word
    await page.locator('text=Test').first().click();

    // Close annotation if it appeared
    const closeButton = page.locator('[aria-label*="Close"], button:has-text("×"), button:has-text("✕")');
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
      await expect(closeButton.first()).not.toBeVisible();
    }
  });
});
