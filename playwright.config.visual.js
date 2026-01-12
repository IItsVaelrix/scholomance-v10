// @ts-check
import { defineConfig, devices } from '@playwright/test';
import defaultConfig from './playwright.config.js';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  ...defaultConfig,
  testDir: './tests',
  testMatch: '**/visual.spec.js',
});
