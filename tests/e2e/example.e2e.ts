import { test, expect } from '@playwright/test';

test.describe('Example E2E Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Next/i);
  });

  test('should have main content', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
