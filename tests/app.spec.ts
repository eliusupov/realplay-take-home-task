import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Request,
} from '@playwright/test';

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

function base64UrlJson(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function signInWithDemoTokenCookie(
  context: BrowserContext,
  baseURL: string | undefined,
) {
  const token = `${base64UrlJson({ alg: 'none' })}.${base64UrlJson({ sub: 'u1', email: 'ada@example.com' })}.`;
  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: baseURL },
  ]);
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
  await expect(page.getByRole('alert')).toContainText('registered');
  await expect(page.getByRole('main')).toContainText('ada@example.com');
  await page.getByRole('link', { name: 'Account (ada@example.com)' }).click();
  await expect(page).toHaveURL('/account');
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
  const dropCookieWrites =
    "Object.defineProperty(document, 'cookie', { get: () => '', set: () => {} })";
  await page.addInitScript(dropCookieWrites);
  await page.goto('/account');

  await submitRegistration(page, 'ada@example.com', 'correct horse');

  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('alert')).toContainText(
    'reloading will sign you out',
  );
  await page.reload();
  await expect(page).toHaveURL('/register');
});

const DAY_MS = 24 * 60 * 60 * 1000;
const CAMPAIGN_START = new Date('2026-01-01T09:00:00.000Z');
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function daysAfterStart(days: number) {
  return new Date(CAMPAIGN_START.getTime() + days * DAY_MS);
}

async function visitAt(page: Page, time: Date, url: string) {
  await page.clock.setFixedTime(time);
  await page.goto(url);
  await expect(page.getByRole('main')).toBeVisible();
}

interface RegistrationBody {
  anonymousVisitorId: unknown;
  attribution: unknown;
}

async function registerAndReadAttributionFields(
  page: Page,
  email = 'ada@example.com',
) {
  const request = page.waitForRequest(isRegisterPost);
  await submitRegistration(page, email, 'correct horse');
  const { anonymousVisitorId, attribution } = (
    await request
  ).postDataJSON() as RegistrationBody;
  return { anonymousVisitorId, attribution };
}

test('a campaign link is captured before the auth redirect and sent with registration', async ({
  page,
}) => {
  await visitAt(
    page,
    CAMPAIGN_START,
    '/account?utm_source=a&utm_source=z&utm_medium=&utm_x=b%20c&ref=r&gclid=g%2B1&fbclid=f&welcome=1&promo=p&other=o',
  );
  await expect(page).toHaveURL('/register');

  const body = await registerAndReadAttributionFields(page);

  expect(body.anonymousVisitorId).toMatch(UUID_PATTERN);
  expect(body.attribution).toEqual({
    params: {
      utm_source: 'a',
      utm_x: 'b c',
      ref: 'r',
      gclid: 'g+1',
      fbclid: 'f',
    },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});

test('within 30 days, a later campaign and an untagged revisit keep the first touch', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google&gclid=g1');
  await visitAt(page, daysAfterStart(10), '/?utm_source=instagram&fbclid=f1');
  await visitAt(page, daysAfterStart(20), '/register');

  expect((await registerAndReadAttributionFields(page)).attribution).toEqual({
    params: { utm_source: 'google', gclid: 'g1' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});

test('first touch expires exactly 30 days after capture, and a tagged visit then replaces it', async ({
  page,
}) => {
  const expiryMoment = daysAfterStart(30);
  const lastFreshMoment = new Date(expiryMoment.getTime() - 60_000);
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google&utm_medium=cpc');
  const anonymousVisitorId = await page.evaluate(() =>
    localStorage.getItem('realplay_anonymous_visitor_id'),
  );
  await visitAt(page, lastFreshMoment, '/?utm_source=instagram');
  await visitAt(page, expiryMoment, '/register?utm_source=newsletter');

  const body = await registerAndReadAttributionFields(page);
  expect(body.attribution).toEqual({
    params: { utm_source: 'newsletter' },
    capturedAt: expiryMoment.toISOString(),
  });
  expect(body.anonymousVisitorId).toBe(anonymousVisitorId);
});

test('an untagged visit after expiry stores nothing and registration sends null', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await visitAt(page, daysAfterStart(30), '/register');

  expect((await registerAndReadAttributionFields(page)).attribution).toBeNull();
});

test('an untagged first visit does not block a later campaign', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/');
  await visitAt(page, daysAfterStart(1), '/register?utm_campaign=spring');

  expect((await registerAndReadAttributionFields(page)).attribution).toEqual({
    params: { utm_campaign: 'spring' },
    capturedAt: daysAfterStart(1).toISOString(),
  });
});

test('registration clears attribution, and logout keeps the anonymous visitor id', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/register?utm_source=google');
  const first = await registerAndReadAttributionFields(page);
  expect(first.attribution).not.toBeNull();
  await expect(page.getByRole('alert')).toContainText('registered');

  await visitAt(page, daysAfterStart(1), '/?utm_source=instagram');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/');

  await visitAt(page, daysAfterStart(1), '/register');
  const second = await registerAndReadAttributionFields(
    page,
    'grace@example.com',
  );
  expect(second.attribution).toBeNull();
  expect(second.anonymousVisitorId).toBe(first.anonymousVisitorId);
});

test('logout keeps pending attribution, and later capture follows first touch', async ({
  page,
  context,
  baseURL,
}) => {
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await signInWithDemoTokenCookie(context, baseURL);
  await visitAt(page, daysAfterStart(1), '/account');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/');

  await visitAt(page, daysAfterStart(2), '/register?utm_source=instagram');
  expect((await registerAndReadAttributionFields(page)).attribution).toEqual({
    params: { utm_source: 'google' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});

test('corrupt stored attribution is treated as absent', async ({ page }) => {
  await visitAt(page, CAMPAIGN_START, '/');
  const corruptRecords = [
    '{not json',
    '{"params":{"utm_source":"google"},"capturedAt":"yesterday"}',
    '{"params":{"utm_source":7},"capturedAt":"2026-01-01T09:00:00.000Z"}',
    '{"params":{"welcome":"1"},"capturedAt":"2026-01-01T09:00:00.000Z"}',
    '{"params":{"utm_source":"google"},"capturedAt":"2099-01-01T00:00:00.000Z"}',
    '[]',
  ];
  for (const [index, record] of corruptRecords.entries()) {
    await page.evaluate((value) => {
      localStorage.setItem('realplay_attribution', value);
    }, record);
    await visitAt(
      page,
      CAMPAIGN_START,
      `/?utm_source=campaign${String(index)}`,
    );
    expect(
      await page.evaluate(() => localStorage.getItem('realplay_attribution')),
    ).toBe(
      JSON.stringify({
        params: { utm_source: `campaign${String(index)}` },
        capturedAt: CAMPAIGN_START.toISOString(),
      }),
    );
  }
});

test('when site storage cannot be written, attribution works for the page session with a notice', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    };
  });
  await visitAt(page, CAMPAIGN_START, '/account?utm_source=google');
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('main')).toContainText(
    'kept only until you reload',
  );

  const body = await registerAndReadAttributionFields(page);

  expect(body.anonymousVisitorId).toMatch(UUID_PATTERN);
  expect(body.attribution).toEqual({
    params: { utm_source: 'google' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
  await expect(page).toHaveURL('/account?utm_source=google');
});

test('when site storage is blocked entirely, the app still renders with the notice', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
    });
  });
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(
    'kept only until you reload',
  );
});

test('a modal link survives registration: attribution is sent, then modals open in link order', async ({
  page,
}) => {
  await page.goto('/account?utm_source=x&promo=SPRING&welcome=1#h');
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('dialog')).toBeHidden();

  const body = await registerAndReadAttributionFields(page);

  expect(body.attribution).toMatchObject({ params: { utm_source: 'x' } });
  await expect(page).toHaveURL(
    '/account?utm_source=x&promo=SPRING&welcome=1#h',
  );
  const promo = page.getByRole('dialog', { name: 'Promo code' });
  await expect(promo).toContainText('SPRING');
  await promo.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL('/account?utm_source=x&welcome=1#h');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/account?utm_source=x#h');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('modals follow link order, and closing one removes only its key', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto(
    '/?other=1&welcome=1&utm_medium=m&invite=friend%207&promo=SPRING24#top',
  );

  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await expect(page).toHaveURL(
    '/?other=1&welcome=1&utm_medium=m&invite=friend%207&promo=SPRING24#top',
  );
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(
    '/?other=1&utm_medium=m&invite=friend+7&promo=SPRING24#top',
  );
  await expect(page.getByRole('dialog', { name: 'Invitation' })).toContainText(
    'friend 7',
  );
  const backdropCorner = { x: 5, y: 5 };
  await page.mouse.click(backdropCorner.x, backdropCorner.y);

  await expect(page).toHaveURL('/?other=1&utm_medium=m&promo=SPRING24#top');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toContainText(
    'SPRING24',
  );
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?other=1&utm_medium=m#top');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a repeated key opens one modal with its first value, and closing removes every occurrence', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/?promo=FIRSTVAL&welcome=1&promo=SECONDVAL');

  const promo = page.getByRole('dialog', { name: 'Promo code' });
  await expect(promo).toContainText('FIRSTVAL');
  await expect(promo).not.toContainText('SECONDVAL');
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
});

test('invalid modal values are ignored and stay in the URL', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto('/?welcome=2&promo=&Welcome=1&invite=');
  await expect(page).toHaveURL('/?welcome=2&promo=&Welcome=1&invite=');

  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/?welcome=2&promo=&signup=1&Welcome=1');
  await expect(
    page.getByRole('dialog', { name: 'Registration' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?welcome=2&promo=&Welcome=1');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('signup=1 shows a placeholder when signed in and redirects to registration when signed out', async ({
  page,
  context,
  baseURL,
}) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/?signup=1');
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('dialog')).toBeHidden();

  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/?signup=1');
  const registration = page.getByRole('dialog', { name: 'Registration' });
  await expect(registration).toContainText('placeholder');
  await expect(registration.getByRole('button')).toHaveText(['Close']);
  await expect(registration.getByRole('textbox')).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test('refresh, history and in-app navigation follow the current URL', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/?promo=A&welcome=1');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/?welcome=1');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();

  await page
    .getByRole('link', { name: /Account/, includeHidden: true })
    .dispatchEvent('click');
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL('/?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('logout closes every modal and nothing reopens after registering again', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/account?promo=A&welcome=1');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();

  await page
    .getByRole('button', { name: 'Log out', includeHidden: true })
    .dispatchEvent('click');

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Register' }).click();
  await submitRegistration(page, 'grace@example.com', 'correct horse');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: /Account/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('modals are labelled by their title and keep keyboard focus through the sequence', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithDemoTokenCookie(context, baseURL);
  await page.goto('/?welcome=1&invite=F7');

  const welcome = page.getByRole('dialog', { name: 'Welcome' });
  await expect(welcome).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(welcome.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(welcome.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Enter');

  const invite = page.getByRole('dialog', { name: 'Invitation' });
  await expect(invite).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Realplay' })).toBeFocused();
});
