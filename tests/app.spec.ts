import { expect, test } from '@playwright/test';

test('home route renders the header and the home content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Realplay');
  const banner = page.getByRole('banner');
  await expect(banner.getByRole('link', { name: 'Realplay' })).toBeVisible();
  await expect(
    banner
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Home' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toContainText('mock');
});
