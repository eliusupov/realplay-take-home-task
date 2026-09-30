import { describe, expect, it } from 'vitest';

const visitorId = '3f2b8c1e-4d5a-4b6c-8e7f-9a0b1c2d3e4f';

function postRegister(body: unknown) {
  return fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /register', () => {
  it('creates the user and returns an unsigned token for them', async () => {
    const response = await postRegister({
      email: 'ada@example.com',
      password: 'correct horse',
      anonymousVisitorId: visitorId,
      attribution: null,
    });
    const { user, token } = (await response.json()) as {
      user: { id: string; email: string };
      token: string;
    };

    expect(response.status).toBe(201);
    expect(user.email).toBe('ada@example.com');
    const [, payload] = token.split('.');
    expect(
      JSON.parse(atob(String(payload).replace(/-/g, '+').replace(/_/g, '/'))),
    ).toEqual({
      sub: user.id,
      email: 'ada@example.com',
    });
  });

  it.each([
    { email: 'ada', password: 'correct horse' },
    { email: 'ada@example.com', password: 'short' },
    { password: 'correct horse' },
  ])('rejects invalid credentials %j with 400', async (credentials) => {
    const response = await postRegister({
      ...credentials,
      anonymousVisitorId: visitorId,
      attribution: null,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Enter a valid email and a password of at least 8 characters.',
    });
  });

  it('rejects a missing visitor id with 400', async () => {
    const response = await postRegister({
      email: 'ada@example.com',
      password: 'correct horse',
      attribution: null,
    });

    expect(response.status).toBe(400);
  });
});
