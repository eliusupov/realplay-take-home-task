import { delay, http, HttpResponse } from 'msw';
import type { RegisteredUser } from '../types';
import { isAnonymousVisitorId, isAttribution } from '../utils/attribution';
import { MIN_PASSWORD_LENGTH, validateRegistration } from '../utils/validation';

const FAILING_EMAIL = 'fail@example.com';
const PENDING_STATE_VISIBLE_DELAY_MS = 500;

function base64UrlJson(value: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function createUnsignedDemoToken(user: RegisteredUser) {
  return `${base64UrlJson({ alg: 'none', typ: 'JWT' })}.${base64UrlJson({ sub: user.id, email: user.email })}.`;
}

export const handlers = [
  http.post('/register', async ({ request }) => {
    await delay(PENDING_STATE_VISIBLE_DELAY_MS);
    const body: unknown = await request.json().catch(() => null);
    const { email, password, anonymousVisitorId, attribution } = (
      typeof body === 'object' && body !== null ? body : {}
    ) as Record<string, unknown>;
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      Object.keys(validateRegistration({ email, password })).length > 0
    ) {
      return HttpResponse.json(
        {
          message: `Enter a valid email and a password of at least ${String(MIN_PASSWORD_LENGTH)} characters.`,
        },
        { status: 400 },
      );
    }
    if (
      !isAnonymousVisitorId(anonymousVisitorId) ||
      (attribution !== null && !isAttribution(attribution))
    ) {
      return HttpResponse.json(
        { message: 'The sign-up request was not valid. Please try again.' },
        { status: 400 },
      );
    }
    if (email.toLowerCase() === FAILING_EMAIL) {
      return HttpResponse.json(
        {
          message:
            'The server could not create your account. Try again with a different email.',
        },
        { status: 500 },
      );
    }
    const user = { id: crypto.randomUUID(), email };
    const token = createUnsignedDemoToken(user);
    return HttpResponse.json({ user, token }, { status: 201 });
  }),
];
