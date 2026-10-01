import { expect, test } from '@playwright/test';
import {
  ATTRIBUTION_COOKIE,
  CAMPAIGN_START,
  daysAfterStart,
  decodeAttributionCookie,
  findCookie,
  registerAndReadAttribution,
  signInWithSessionCookie,
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

  expect(await registerAndReadAttribution(page)).toEqual({
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

  expect(await registerAndReadAttribution(page)).toEqual({
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
  await visitAt(page, lastFreshMoment, '/?utm_source=instagram');
  await visitAt(page, expiryMoment, '/register?utm_source=newsletter');

  expect(await registerAndReadAttribution(page)).toEqual({
    params: { utm_source: 'newsletter' },
    capturedAt: expiryMoment.toISOString(),
  });
});

test('an untagged visit after expiry stores nothing and registration sends null', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await visitAt(page, daysAfterStart(30), '/register');

  expect(await registerAndReadAttribution(page)).toBeNull();
});

test('an untagged first visit does not block a later campaign', async ({
  page,
}) => {
  await visitAt(page, CAMPAIGN_START, '/');
  await visitAt(page, daysAfterStart(1), '/register?utm_campaign=spring');

  expect(await registerAndReadAttribution(page)).toEqual({
    params: { utm_campaign: 'spring' },
    capturedAt: daysAfterStart(1).toISOString(),
  });
});

test('registration clears attribution; after logout the URL campaign is recorded again only on reload', async ({
  page,
  context,
}) => {
  await visitAt(page, CAMPAIGN_START, '/register?utm_source=google');
  expect(await registerAndReadAttribution(page)).not.toBeNull();
  await expect(page.getByRole('alert')).toContainText('registered');

  await visitAt(page, daysAfterStart(1), '/?utm_source=instagram');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/?utm_source=instagram');
  expect(await findCookie(context, ATTRIBUTION_COOKIE)).toBeUndefined();

  await page.reload();
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  expect(await registerAndReadAttribution(page, 'grace@example.com')).toEqual({
    params: { utm_source: 'instagram' },
    capturedAt: daysAfterStart(1).toISOString(),
  });
});

test('logout keeps pending attribution, and later capture follows first touch', async ({
  page,
  context,
  baseURL,
}) => {
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await signInWithSessionCookie(context, baseURL);
  await visitAt(page, daysAfterStart(1), '/account');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/');

  await visitAt(page, daysAfterStart(2), '/register?utm_source=instagram');
  expect(await registerAndReadAttribution(page)).toEqual({
    params: { utm_source: 'google' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});

test('the attribution cookie is first-party, written once for 30 days, and expired by registration', async ({
  page,
  context,
}) => {
  const daySeconds = 24 * 60 * 60;
  await visitAt(page, CAMPAIGN_START, '/?utm_source=google');
  await visitAt(page, daysAfterStart(10), '/register');

  const cookie = await findCookie(context, ATTRIBUTION_COOKIE);
  expect(cookie).toMatchObject({ path: '/', sameSite: 'Lax', httpOnly: false });
  expect(cookie?.expires).toBeCloseTo(Date.now() / 1000 + 30 * daySeconds, -2);
  expect(decodeAttributionCookie(cookie?.value)).toEqual({
    params: { utm_source: 'google' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });

  await registerAndReadAttribution(page);
  await expect(page.getByRole('alert')).toContainText('registered');
  expect(await findCookie(context, ATTRIBUTION_COOKIE)).toBeUndefined();
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

  expect(await registerAndReadAttribution(page)).toEqual({
    params: { utm_source: 'typo' },
    capturedAt: CAMPAIGN_START.toISOString(),
  });
});
