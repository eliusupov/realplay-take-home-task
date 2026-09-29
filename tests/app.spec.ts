import { expect, test, type Page, type Request } from '@playwright/test';

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

const SESSION_COOKIE = 'realplay_session';

async function submitRegistration(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
}

function isRegisterPost(request: Request) {
  return (
    request.method() === 'POST' &&
    new URL(request.url()).pathname === '/register'
  );
}

function trackRegisterRequests(page: Page) {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (isRegisterPost(request)) requests.push(request);
  });
  return requests;
}

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
  await page.goto('/register');

  await submitRegistration(page, 'fail@example.com', 'correct horse');
  await expect(page.getByRole('alert')).toContainText('Try again');
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('link', { name: /Account/ })).toBeHidden();

  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('alert')).toContainText('registered');
});

test('registration sends email and password as JSON and returns to the requested page with a toast', async ({
  page,
}) => {
  await page.goto('/account?x=1#h');
  await expect(page).toHaveURL('/register');

  const request = page.waitForRequest(isRegisterPost);
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  expect(Object.keys((await request).postDataJSON() as object)).toEqual([
    'email',
    'password',
  ]);

  await expect(page).toHaveURL('/account?x=1#h');
  await expect(page.getByRole('alert')).toContainText('registered');
  await expect(page.getByRole('main')).toContainText('ada@example.com');
  await page.getByRole('link', { name: 'Account (ada@example.com)' }).click();
  await expect(page).toHaveURL('/account');
});

test('without a stored origin, registration returns home keeping its own query and hash', async ({
  page,
}) => {
  await page.goto('/register?promo=X#top');

  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/?promo=X#top');
});

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

test('malformed session cookies do not grant access', async ({
  page,
  context,
  baseURL,
}) => {
  for (const value of ['garbage', 'a.b.c', 'e30.e30.']) {
    await context.addCookies([{ name: SESSION_COOKIE, value, url: baseURL }]);
    await page.goto('/account');
    await expect(page).toHaveURL('/register');
  }
});

test('logout ends the session and returns to a clean home page', async ({
  page,
  context,
}) => {
  await page.goto('/account?x=1#h');
  await submitRegistration(page, 'ada@example.com', 'correct horse');
  await expect(page).toHaveURL('/account?x=1#h');
  await expect(page.getByRole('alert')).toContainText('registered');

  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByRole('link', { name: /Account/ })).toBeHidden();
  expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE)).toBe(
    false,
  );
  await page.goto('/account');
  await expect(page).toHaveURL('/register');
});

test('when the session cookie cannot be written, the visitor is told the session ends on reload', async ({
  page,
}) => {
  // Simulates a browser that blocks cookies: writes are dropped.
  await page.addInitScript(
    "Object.defineProperty(document, 'cookie', { get: () => '', set: () => {} })",
  );
  await page.goto('/account');

  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('alert')).toContainText(
    'reloading will sign you out',
  );
  await page.reload();
  await expect(page).toHaveURL('/register');
});
