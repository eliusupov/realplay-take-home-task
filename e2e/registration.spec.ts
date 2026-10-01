import { expect, test } from '@playwright/test';
import {
  ATTRIBUTION_COOKIE,
  findCookie,
  isRegisterPost,
  registerAndReadAttributionFields,
  SESSION_COOKIE,
  submitRegistration,
  trackRegisterRequests,
} from './helpers';

test('an invalid email is explained and nothing is sent', async ({ page }) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/register');

  await submitRegistration(page, 'ada@example', 'correct horse');

  const email = page.getByLabel('Email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/like name@example\.com/);
  await expect(email).toBeFocused();
  expect(requests).toHaveLength(0);
});

test('a password shorter than 8 characters is explained and nothing is sent', async ({
  page,
}) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/register');

  await submitRegistration(page, 'ada@example.com', '1234567');

  const password = page.getByLabel('Password');
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveAccessibleDescription(/at least 8 characters/);
  expect(requests).toHaveLength(0);
});

test('a pending registration cannot be submitted twice', async ({ page }) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/register');

  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  await page.getByLabel('Password').press('Enter');

  await expect(page).toHaveURL('/');
  expect(requests).toHaveLength(1);
});

test('fail@example.com shows a server error, and a retry succeeds', async ({
  page,
}) => {
  await page.goto('/register?utm_source=google');

  const failed = await registerAndReadAttributionFields(
    page,
    'fail@example.com',
  );
  await expect(page.getByRole('alert')).toContainText('Try again');
  await expect(page).toHaveURL('/register?utm_source=google');
  await expect(page.getByRole('link', { name: /Account/ })).toBeHidden();

  const retried = await registerAndReadAttributionFields(page);
  await expect(page).toHaveURL('/?utm_source=google');
  await expect(page.getByRole('alert')).toContainText('registered');
  expect(failed.attribution).toMatchObject({
    params: { utm_source: 'google' },
  });
  expect(retried).toEqual(failed);
});

test('registration sends a JSON body and returns to the requested page with a toast', async ({
  page,
}) => {
  await page.goto('/account?x=1#h');
  await expect(page).toHaveURL('/register');

  const request = page.waitForRequest(isRegisterPost);
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  expect(Object.keys((await request).postDataJSON() as object)).toEqual([
    'email',
    'password',
    'anonymousVisitorId',
    'attribution',
  ]);

  await expect(page).toHaveURL('/account?x=1#h');
  await expect(page.getByRole('alert')).toHaveText(
    "You're registered and signed in.",
  );
  await expect(page.getByRole('main')).toContainText('ada@example.com');
  await page.getByRole('link', { name: 'Account (ada@example.com)' }).click();
  await expect(page).toHaveURL('/account?x=1');
});

test('without a stored origin, registration returns home keeping its own query and hash', async ({
  page,
}) => {
  await page.goto('/register?promo=X#top');
  await expect(page.getByRole('dialog')).toBeHidden();

  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/?promo=X#top');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toContainText(
    'X',
  );
});

test('automatic redirects replace history, so Back skips /register and the protected URL', async ({
  page,
}) => {
  await page.goto('/');
  await page.goto('/account');
  await expect(page).toHaveURL('/register');
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page).toHaveURL('/account');

  await page.goBack();

  await expect(page).toHaveURL('/');
});

test('leaving the page while registration is pending does not sign the visitor in', async ({
  page,
  context,
}) => {
  const hasCookie = async (name: string) =>
    Boolean(await findCookie(context, name));
  await page.goto('/register?utm_source=pending');
  await expect.poll(() => hasCookie(ATTRIBUTION_COOKIE)).toBe(true);
  const response = page.waitForResponse((r) => isRegisterPost(r.request()));
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await page.getByRole('link', { name: 'Home' }).click();

  expect((await response).status()).toBe(201);
  await expect.poll(() => hasCookie(ATTRIBUTION_COOKIE)).toBe(false);

  expect(await hasCookie(SESSION_COOKIE)).toBe(false);
  await expect(page).toHaveURL('/?utm_source=pending');
  await expect(page.getByRole('button', { name: 'Log out' })).toBeHidden();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('a pop-up link survives leaving /register before signing up, then is forgotten', async ({
  page,
}) => {
  await page.goto('/account?utm_source=google&promo=SPRING&welcome=1');
  await expect(page).toHaveURL('/register');
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL(
    '/account?utm_source=google&promo=SPRING&welcome=1',
  );
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  await submitRegistration(page, 'grace@example.com', 'correct horse');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a direct /register pop-up link also survives a detour', async ({
  page,
}) => {
  await page.goto('/register?welcome=1');
  await expect(
    page.getByRole('heading', { name: 'Create an account' }),
  ).toBeVisible();
  await page.goto('/');
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
});
