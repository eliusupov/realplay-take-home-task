import {
  expect,
  type BrowserContext,
  type Page,
  type Request,
} from '@playwright/test';

export const SESSION_COOKIE = 'realplay_session';

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

function base64UrlJson(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export async function signInWithDemoTokenCookie(
  context: BrowserContext,
  baseURL: string | undefined,
) {
  const token = `${base64UrlJson({ alg: 'none' })}.${base64UrlJson({ sub: 'u1', email: 'ada@example.com' })}.`;
  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: baseURL },
  ]);
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const CAMPAIGN_START = new Date('2026-01-01T09:00:00.000Z');
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function daysAfterStart(days: number) {
  return new Date(CAMPAIGN_START.getTime() + days * DAY_MS);
}

export async function visitAt(page: Page, time: Date, url: string) {
  await page.clock.setFixedTime(time);
  await page.goto(url);
  await expect(page.getByRole('main')).toBeVisible();
}

interface RegistrationBody {
  anonymousVisitorId: unknown;
  attribution: unknown;
}

export async function registerAndReadAttributionFields(
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
