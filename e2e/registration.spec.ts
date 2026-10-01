import { expect, test } from '@playwright/test';
import {
  ATTRIBUTION_COOKIE,
  findCookie,
  isRegisterPost,
  registerAndReadAttribution,
  SESSION_COOKIE,
  submitRegistration,
  trackRegisterRequests,
} from './helpers';

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

  const failed = await registerAndReadAttribution(page, 'fail@example.com');
  await expect(page.getByRole('alert')).toContainText('Try again');
  await expect(page).toHaveURL('/register?utm_source=google');
  await expect(page.getByRole('link', { name: /Account/ })).toBeHidden();

  const retried = await registerAndReadAttribution(page);
  await expect(page).toHaveURL('/?utm_source=google');
  await expect(page.getByRole('alert')).toContainText('registered');
  expect(failed).toMatchObject({ params: { utm_source: 'google' } });
  expect(retried).toEqual(failed);
});

test('registration sends a JSON body and returns to the requested page with a toast', async ({
  page,
}) => {
  await page.goto('/account?x=1#h');
  await expect(page).toHaveURL('/register?x=1');

  const request = page.waitForRequest(isRegisterPost);
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  expect(Object.keys((await request).postDataJSON() as object)).toEqual([
    'email',
    'password',
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
  await expect(page).toHaveURL(
    '/register?utm_source=google&promo=SPRING&welcome=1',
  );
  await expect(page.getByRole('link', { name: 'Home' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Realplay' })).toBeHidden();
  await page.goto('/');
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
  await expect(page).toHaveURL('/?utm_source=google');
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

test('the newest pop-up link wins when several were opened before signing up', async ({
  page,
}) => {
  for (const url of ['/register?promo=A', '/register?promo=B']) {
    await page.goto(url);
    await expect(
      page.getByRole('heading', { name: 'Create an account' }),
    ).toBeVisible();
  }
  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/?promo=B');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toContainText(
    'B',
  );
});

test('leaving an empty email by clicking Register shows its error in one click', async ({
  page,
}) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/register');
  await page.getByLabel('Password').fill('correct horse');
  await page.getByLabel('Email').click();

  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByLabel('Email')).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(requests).toHaveLength(0);
});
