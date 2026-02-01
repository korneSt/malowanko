import { test, expect } from '@playwright/test';

/**
 * Example E2E test
 * 
 * This is a placeholder test to verify Playwright setup.
 * Replace with actual E2E tests based on plan-testow.md
 */

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await expect(page).toHaveTitle(/Malowanko/i);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'e2e/screenshots/homepage.png' });
});
