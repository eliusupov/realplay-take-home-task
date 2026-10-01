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

test('an unknown URL shows page not found with a working link home', async ({
  page,
}) => {
  await page.goto('/does-not-exist');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Go to home' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('banner')).toBeVisible();
});

test('in-app links keep the whole query string', async ({ page }) => {
  await page.goto('/?utm_source=google&x=1');

  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  await expect(page).toHaveURL('/register?utm_source=google&x=1');
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('/?utm_source=google&x=1');
  await page.getByRole('link', { name: 'Realplay' }).click();
  await expect(page).toHaveURL('/?utm_source=google&x=1');
});
