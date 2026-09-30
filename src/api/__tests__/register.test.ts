import { describe, expect, it, vi } from 'vitest';
import {
  captureAttribution,
  snapshotRegistrationAttribution,
} from '../../utils/attribution';
import { registerUser } from '../register';

describe('registerUser', () => {
  it('sends the credentials, visitor id and fresh attribution', async () => {
    captureAttribution('?utm_source=newsletter&gclid=abc');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await registerUser({ email: 'ada@example.com', password: 'correct horse' });

    const body = JSON.parse(
      fetchSpy.mock.calls[0]?.[1]?.body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      email: 'ada@example.com',
      password: 'correct horse',
      attribution: { params: { utm_source: 'newsletter', gclid: 'abc' } },
    });
    expect(body.anonymousVisitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('returns the new user and clears attribution but keeps the visitor id', async () => {
    captureAttribution('?ref=friend');
    const { anonymousVisitorId } = snapshotRegistrationAttribution();

    const response = await registerUser({
      email: 'ada@example.com',
      password: 'correct horse',
    });

    expect(response.user.email).toBe('ada@example.com');
    expect(snapshotRegistrationAttribution()).toEqual({
      anonymousVisitorId,
      attribution: null,
    });
  });

  it('rejects with the server message and keeps attribution when sign-up fails', async () => {
    captureAttribution('?ref=friend');

    await expect(
      registerUser({ email: 'fail@example.com', password: 'correct horse' }),
    ).rejects.toThrow(
      'The server could not create your account. Try again with a different email.',
    );
    expect(snapshotRegistrationAttribution().attribution?.params).toEqual({
      ref: 'friend',
    });
  });
});
