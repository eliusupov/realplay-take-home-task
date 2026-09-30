import { describe, expect, it } from 'vitest';
import { createUnsignedDemoToken } from '../../mocks/handlers';
import {
  deleteSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from '../session';

const ADA = { id: 'u1', email: 'ada@example.com' };

describe('session cookie', () => {
  it('reads back the user from a written token and forgets it once deleted', () => {
    expect(writeSessionCookie(createUnsignedDemoToken(ADA))).toBe(true);
    expect(readSessionCookie()).toEqual(ADA);

    deleteSessionCookie();

    expect(readSessionCookie()).toBeNull();
  });

  it('returns null when there is no session cookie', () => {
    expect(readSessionCookie()).toBeNull();
  });

  it.each([
    ['a token without three parts', 'abc.def'],
    ['a payload that is not base64 JSON', 'e30.%%%.'],
    ['claims missing the email', `e30.${btoa('{"sub":"u1"}')}.`],
    [
      'claims with an empty subject',
      `e30.${btoa('{"sub":"","email":"ada@example.com"}')}.`,
    ],
  ])('rejects %s', (_, token) => {
    writeSessionCookie(token);

    expect(readSessionCookie()).toBeNull();
  });
});
