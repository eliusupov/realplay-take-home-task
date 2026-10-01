import { expect, test } from '@playwright/test';
import { SESSION_COOKIE, submitRegistration } from './helpers';

test('the session survives a reload and an existing session skips registration', async ({
  page,
}) => {
  await page.goto('/register');
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page).toHaveURL('/');

  await page.goto('/account');
  await page.reload();
  await expect(page.getByRole('main')).toContainText('ada@example.com');

  await page.goto('/register?promo=X');
  await expect(page).toHaveURL('/?promo=X');
});

test('logout ends the session and returns home keeping the query', async ({
  page,
  context,
}) => {
  await page.goto('/account?x=1#h');
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page).toHaveURL('/account?x=1#h');
  await expect(page.getByRole('alert')).toContainText('registered');

  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL('/?x=1');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByRole('link', { name: /Account/ })).toBeHidden();
  expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE)).toBe(
    false,
  );
  await page.goto('/account');
  await expect(page).toHaveURL('/register');
});
