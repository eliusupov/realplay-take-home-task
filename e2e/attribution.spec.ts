import { expect, test } from '@playwright/test';
import {
  CAMPAIGN_START,
  daysAfterStart,
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
