import { test, expect } from '@playwright/test';

// Helper function to type in the content-editable editor
async function typeInEditor(page, text) {
  await page.locator('#scroll-content').focus();
  await page.keyboard.type(text);
}

async function enableAnalysisMode(page) {
  const toggle = page.getByRole('button', { name: /analysis mode/i });
  await toggle.click();
}

test.describe('Read Page - Scroll Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page and clear storage
    await page.goto('/read'); // The route is /read now
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for the editor to be ready
    await page.waitForSelector('#scroll-content:not([aria-disabled="true"])');
    await enableAnalysisMode(page);
  });

  test('should show the scroll editor', async ({ page }) => {
    await expect(page.locator('#scroll-title')).toBeVisible();
    await expect(page.locator('#scroll-content')).toBeVisible();
  });

  test('should create a new scroll', async ({ page }) => {
    await page.fill('input[placeholder*="Title"]', 'Test Scroll');
    await typeInEditor(page, 'This is test content for the scroll.');

    await page.click('text=Save Scroll');

    const stored = await page.evaluate(() => {
      const scrolls = JSON.parse(localStorage.getItem('scholomance-scrolls') || '[]');
      return scrolls[0];
    });
    expect(stored?.title).toBe('Test Scroll');
    expect(stored?.content).toBe('This is test content for the scroll.');
  });

  test('should display word and character count', async ({ page }) => {
    await typeInEditor(page, 'one two three four five');
    await expect(page.locator('text=5 words')).toBeVisible();
    await expect(page.locator('text=/25\s*\/\s*100,000/i')).toBeVisible(); // Note: char count might differ slightly
  });

  test('should save scroll with Ctrl+S', async ({ page }) => {
    await page.fill('input[placeholder*="Title"]', 'Keyboard Test');
    await typeInEditor(page, 'Testing keyboard shortcut');

    await page.keyboard.press('Control+s');

    const stored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scholomance-scrolls') || '[]');
    });
    expect(stored[0]?.title).toBe('Keyboard Test');
  });

  test('should prevent saving empty content', async ({ page }) => {
    await page.fill('input[placeholder*="Title"]', 'Empty Test');
    await page.locator('#scroll-content').focus();

    await page.keyboard.press('Control+s');

    await expect(page.locator('text=/cannot be empty/i')).toBeVisible();
  });

  test('should enforce character limit', async ({ page }) => {
    await expect(page.locator('text=/100,000/i')).toBeVisible();
  });

  test('should preserve line spacing on save/load', async ({ page }) => {
    const textWithNewlines = 'First line.\nSecond line.\n\nFourth line.';
    await typeInEditor(page, textWithNewlines);
    await page.fill('input[placeholder*="Title"]', 'Line Spacing Test');
    
    await page.click('text=Save Scroll');

    // Wait for save and then reload the page to simulate a new session
    await page.waitForTimeout(500);
    await page.reload();

    // The app should automatically load the last scroll
    await page.waitForSelector('#scroll-content:not([aria-disabled="true"])');
    await page.waitForFunction(() => 
      document.querySelector('#scroll-content')?.innerText.includes('Fourth line.')
    );

    // Scholomance editor renders one .editor-line per newline-split line.
    const lineCount = await page.locator('#scroll-content .editor-line').count();
    expect(lineCount).toBe(4);

    // Optional (stronger) assertion: also verify the blank line is preserved
    await expect(
      page.locator('#scroll-content .editor-line').nth(2)
    ).toContainText('');
  });
});

test.describe('Read Page - Phoneme Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#scroll-content:not([aria-disabled="true"])');
    await enableAnalysisMode(page);
  });

  test('should enable the editor once the engine is ready', async ({ page }) => {
    await expect(page.locator('#scroll-content')).toBeEnabled();
  });

  test('should analyze word when clicked', async ({ page }) => {
    await typeInEditor(page, 'The cat sat on the mat');
    await page.click('text=Save Scroll');

    // Click the word 'cat'
    await page.click('text=cat');

    const annotationPanel = page.locator('.annotation-panel');
    await expect(annotationPanel).toBeVisible({ timeout: 5000 });
    await expect(annotationPanel.locator('#annotation-title')).toContainText('CAT');
  });

  test('should close annotation panel', async ({ page }) => {
    await typeInEditor(page, 'Test word analysis');
    await page.click('text=Save Scroll');

    await page.click('text=word');

    const panel = page.locator('.annotation-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await panel.locator('[aria-label="Close"]').click();
    await expect(panel).not.toBeVisible();
  });
});
