import { describe, expect, it } from 'vitest';
import { validateRegistration } from '../validation';

describe('validateRegistration', () => {
  it('accepts a well-formed email and an 8-character password', () => {
    expect(
      validateRegistration({ email: 'ada@example.com', password: '12345678' }),
    ).toEqual({});
  });

  it.each(['', 'ada', 'ada@example', 'ada @example.com', '@example.com'])(
    'rejects the email %j',
    (email) => {
      expect(
        validateRegistration({ email, password: 'correct horse' }).email,
      ).toBeDefined();
    },
  );

  it('rejects a 7-character password with the minimum length', () => {
    expect(
      validateRegistration({ email: 'ada@example.com', password: '1234567' }),
    ).toEqual({ password: 'Use at least 8 characters.' });
  });
});
