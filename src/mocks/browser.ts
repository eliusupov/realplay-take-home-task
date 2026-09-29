import { delay, http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import {
  MIN_PASSWORD_LENGTH,
  validateRegistration,
} from '../features/registration/registration';

const FAILING_EMAIL = 'fail@example.com';

function base64UrlJson(value: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Stand-in backend: answers only POST /register (GET /register is the SPA page).
export const worker = setupWorker(
  http.post('/register', async ({ request }) => {
    await delay(500); // Fixed latency, so the pending state is visible.
    const body: unknown = await request.json().catch(() => null);
    const { email, password } = (
      typeof body === 'object' && body !== null ? body : {}
    ) as Record<string, unknown>;
    // Re-check the form's rules: the client is not a trust boundary.
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
    // JWT-shaped but unsigned (alg "none", empty signature): a demo token, not authentication.
    const token = `${base64UrlJson({ alg: 'none', typ: 'JWT' })}.${base64UrlJson({ sub: user.id, email })}.`;
    return HttpResponse.json({ user, token }, { status: 201 });
  }),
);
