import { delay, http, HttpResponse } from 'msw';
import { MIN_PASSWORD_LENGTH, validateRegistration } from '../utils/validation';

const FAILING_EMAIL = 'fail@example.com';
const PENDING_STATE_VISIBLE_DELAY_MS = 500;

export const handlers = [
  http.post('/register', async ({ request }) => {
    await delay(PENDING_STATE_VISIBLE_DELAY_MS);
    const body: unknown = await request.json().catch(() => null);
    const { email, password } = (
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
    if (email.toLowerCase() === FAILING_EMAIL) {
      return HttpResponse.json(
        {
          message:
            'The server could not create your account. Try again with a different email.',
        },
        { status: 500 },
      );
    }
    return HttpResponse.json(
      { user: { id: crypto.randomUUID(), email } },
      { status: 201 },
    );
  }),
];
