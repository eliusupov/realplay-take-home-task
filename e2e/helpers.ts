import {
  expect,
  type BrowserContext,
  type Page,
  type Request,
} from '@playwright/test';

export const SESSION_COOKIE = 'realplay_session';
export const ATTRIBUTION_COOKIE = 'realplay_attribution';

export async function findCookie(context: BrowserContext, name: string) {
  return (await context.cookies()).find((cookie) => cookie.name === name);
}

export function decodeAttributionCookie(value: string | undefined) {
  return JSON.parse(decodeURIComponent(value ?? '')) as unknown;
}

export async function submitRegistration(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
}

export function isRegisterPost(request: Request) {
  return (
    request.method() === 'POST' &&
    new URL(request.url()).pathname === '/register'
  );
}

export function trackRegisterRequests(page: Page) {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (isRegisterPost(request)) requests.push(request);
  });
  return requests;
}

export async function signInWithSessionCookie(
  context: BrowserContext,
  baseURL: string | undefined,
) {
  const user = { id: 'u1', email: 'ada@example.com' };
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: encodeURIComponent(JSON.stringify(user)),
      url: baseURL,
    },
  ]);
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const CAMPAIGN_START = new Date('2026-01-01T09:00:00.000Z');

export function daysAfterStart(days: number) {
  return new Date(CAMPAIGN_START.getTime() + days * DAY_MS);
}

export async function visitAt(page: Page, time: Date, url: string) {
  await page.clock.setFixedTime(time);
  await page.goto(url);
  await expect(page.getByRole('main')).toBeVisible();
}

export async function registerAndReadAttribution(
  page: Page,
  email = 'ada@example.com',
) {
  const request = page.waitForRequest(isRegisterPost);
  await submitRegistration(page, email, 'correct horse');
  const { attribution } = (await request).postDataJSON() as {
    attribution: unknown;
  };
  return attribution;
}
