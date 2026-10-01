import { expect, test } from '@playwright/test';
import {
  ANONYMOUS_VISITOR_ID_COOKIE,
  ATTRIBUTION_COOKIE,
  CAMPAIGN_START,
  daysAfterStart,
  decodeAttributionCookie,
  findCookie,
  registerAndReadAttributionFields,
  signInWithDemoTokenCookie,
  UUID_PATTERN,
  visitAt,
} from './helpers';

test('a campaign link is captured before the auth redirect and sent with registration', async ({
  page,
}) => {
  await visitAt(
    page,
    CAMPAIGN_START,
    '/account?utm_source=a&utm_source=z&utm_medium=&utm_x=b%20c&ref=r&gclid=g%2B1&fbclid=f&welcome=1&promo=p&other=o',
  );
  await expect(page).toHaveURL(
    '/register?utm_source=a&utm_source=z&utm_medium=&utm_x=b%20c&ref=r&gclid=g%2B1&fbclid=f&welcome=1&promo=p&other=o',
  );

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
  context,
}) => {
  const expiryMoment = daysAfterStart(30);
  const lastFreshMoment = new Date(expiryMoment.getTime() - 60_000);
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google&utm_medium=cpc');
  const anonymousVisitorId = (
    await findCookie(context, ANONYMOUS_VISITOR_ID_COOKIE)
  )?.value;
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

test('registration clears attribution; after logout the URL campaign is recorded again only on reload, with the same visitor id', async ({
  page,
  context,
}) => {
  await visitAt(page, CAMPAIGN_START, '/register?utm_source=google');
  const first = await registerAndReadAttributionFields(page);
  expect(first.attribution).not.toBeNull();
  await expect(page.getByRole('alert')).toContainText('registered');

  await visitAt(page, daysAfterStart(1), '/?utm_source=instagram');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/?utm_source=instagram');
  expect(await findCookie(context, ATTRIBUTION_COOKIE)).toBeUndefined();

  await page.reload();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  const second = await registerAndReadAttributionFields(
    page,
    'grace@example.com',
  );
  expect(second.attribution).toEqual({
    params: { utm_source: 'instagram' },
    capturedAt: daysAfterStart(1).toISOString(),
  });
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

test('cookies are first-party, renewed on each visit, and registration expires only attribution', async ({
  page,
  context,
  baseURL,
}) => {
  const daySeconds = 24 * 60 * 60;
  async function shortenVisitorIdLifetime() {
    const cookie = await findCookie(context, ANONYMOUS_VISITOR_ID_COOKIE);
    await context.addCookies([
      {
        name: ANONYMOUS_VISITOR_ID_COOKIE,
        value: cookie?.value ?? '',
        url: baseURL,
        expires: Date.now() / 1000 + 3600,
      },
    ]);
  }
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await shortenVisitorIdLifetime();
  await visitAt(page, daysAfterStart(10), '/register');

  const nowSeconds = Date.now() / 1000;
  const attribution = await findCookie(context, ATTRIBUTION_COOKIE);
  const visitorId = await findCookie(context, ANONYMOUS_VISITOR_ID_COOKIE);
  for (const cookie of [attribution, visitorId]) {
    expect(cookie).toMatchObject({
      path: '/',
      sameSite: 'Lax',
      httpOnly: false,
    });
  }
  expect(attribution?.expires).toBeCloseTo(nowSeconds + 20 * daySeconds, -2);
  expect(visitorId?.expires).toBeCloseTo(nowSeconds + 400 * daySeconds, -2);
  expect(decodeAttributionCookie(attribution?.value)).toEqual({
    params: { utm_source: 'google' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });

  await shortenVisitorIdLifetime();
  const body = await registerAndReadAttributionFields(page);
  await expect(page.getByRole('alert')).toContainText('registered');

  expect(body.anonymousVisitorId).toBe(visitorId?.value);
  expect(await findCookie(context, ATTRIBUTION_COOKIE)).toBeUndefined();
  const renewedVisitorId = await findCookie(
    context,
    ANONYMOUS_VISITOR_ID_COOKIE,
  );
  expect(renewedVisitorId?.value).toBe(visitorId?.value);
  expect(renewedVisitorId?.expires).toBeCloseTo(
    Date.now() / 1000 + 400 * daySeconds,
    -2,
  );
});

test('corrupt stored attribution is treated as absent', async ({
  page,
  context,
  baseURL,
}) => {
  await visitAt(page, CAMPAIGN_START, '/');
  const corruptValues = [
    '%E0%A4%A',
    ...[
      '{not json',
      '{"params":{"utm_source":"google"},"capturedAt":"yesterday"}',
      '{"params":{"utm_source":7},"capturedAt":"2026-01-01T09:00:00.000Z"}',
      '{"params":{"welcome":"1"},"capturedAt":"2026-01-01T09:00:00.000Z"}',
      '{"params":{"utm_source":"google"},"capturedAt":"2099-01-01T00:00:00.000Z"}',
      '[]',
    ].map(encodeURIComponent),
  ];
  for (const [index, value] of corruptValues.entries()) {
    await context.addCookies([
      { name: ATTRIBUTION_COOKIE, value, url: baseURL },
    ]);
    await visitAt(
      page,
      CAMPAIGN_START,
      `/?utm_source=campaign${String(index)}`,
    );
    expect(
      decodeAttributionCookie(
        (await findCookie(context, ATTRIBUTION_COOKIE))?.value,
      ),
    ).toEqual({
      params: { utm_source: `campaign${String(index)}` },
      capturedAt: CAMPAIGN_START.toISOString(),
    });
  }
});

test('a record too large for a cookie is kept for the page session, even over a rejected cookie', async ({
  page,
  context,
  baseURL,
}) => {
  const rejectedValue = encodeURIComponent(
    '{"params":{"utm_source":"google"},"capturedAt":"2099-01-01T00:00:00.000Z"}',
  );
  await context.addCookies([
    { name: ATTRIBUTION_COOKIE, value: rejectedValue, url: baseURL },
  ]);
  const longValue = 'x'.repeat(5000);
  await visitAt(page, CAMPAIGN_START, `/register?utm_content=${longValue}`);
  await expect(page.getByRole('main')).not.toContainText(
    'kept only until you reload',
  );

  expect((await findCookie(context, ATTRIBUTION_COOKIE))?.value).toBe(
    rejectedValue,
  );
  expect((await registerAndReadAttributionFields(page)).attribution).toEqual({
    params: { utm_content: longValue },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});

test('when cookies cannot be written, attribution works for the page session with a notice', async ({
  page,
}) => {
  await page.addInitScript(
    "Object.defineProperty(document, 'cookie', { get: () => '', set: () => {} })",
  );
  await visitAt(page, CAMPAIGN_START, '/account?utm_source=google');
  await expect(page).toHaveURL('/register?utm_source=google');
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

test('when cookies are blocked entirely, the app still renders with the notice', async ({
  page,
}) => {
  await page.addInitScript(
    "const denyAccess = () => { throw new DOMException('Access denied', 'SecurityError') }; Object.defineProperty(document, 'cookie', { get: denyAccess, set: denyAccess })",
  );
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(
    'kept only until you reload',
  );
});

test('when cookies cannot be written, registration also clears the page-session attribution', async ({
  page,
}) => {
  await page.addInitScript(
    "Object.defineProperty(document, 'cookie', { get: () => '', set: () => {} })",
  );
  await visitAt(page, CAMPAIGN_START, '/register?utm_source=google');
  const first = await registerAndReadAttributionFields(page);
  expect(first.attribution).not.toBeNull();

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  const second = await registerAndReadAttributionFields(
    page,
    'grace@example.com',
  );

  expect(second.attribution).toBeNull();
});

test('a campaign link to an unknown page still captures the first touch', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/no-such-page?utm_source=typo');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();

  expect((await registerAndReadAttributionFields(page)).attribution).toEqual({
    params: { utm_source: 'typo' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});
