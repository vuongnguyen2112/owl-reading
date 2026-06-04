import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Owl Reading/);
  await expect(
    page.getByRole('heading', {
      name: /Read web novels with a focused chapter experience/i,
    }),
  ).toBeVisible();
});
