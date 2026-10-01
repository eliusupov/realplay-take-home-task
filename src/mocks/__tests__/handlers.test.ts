import { describe, expect, it } from 'vitest';

function postRegister(body: unknown) {
  return fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /register', () => {
  it('creates the user', async () => {
    const response = await postRegister({
      email: 'ada@example.com',
      password: 'correct horse',
      attribution: null,
    });
    const { user } = (await response.json()) as {
      user: { id: string; email: string };
    };

    expect(response.status).toBe(201);
    expect(Object.keys(user)).toEqual(['id', 'email']);
    expect(user.email).toBe('ada@example.com');
  });

  it('never echoes the password in the response', async () => {
    const response = await postRegister({
      email: 'ada@example.com',
      password: 'unique-secret-42',
      attribution: null,
    });

    expect(response.status).toBe(201);
    expect(await response.text()).not.toContain('unique-secret-42');
  });

  it.each([
    { email: 'ada', password: 'correct horse' },
    { email: 'ada@example.com', password: 'short' },
    { password: 'correct horse' },
  ])('rejects invalid credentials %j with 400', async (credentials) => {
    const response = await postRegister({ ...credentials, attribution: null });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Enter a valid email and a password of at least 8 characters.',
    });
  });
});
