import { describe, expect, it } from 'vitest';
import {
  deleteSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from '../session';

const ADA = { id: 'u1', email: 'ada@example.com' };

describe('session cookie', () => {
  it('reads back the written user and forgets it once deleted', () => {
    writeSessionCookie(ADA);
    expect(readSessionCookie()).toEqual(ADA);

    deleteSessionCookie();

    expect(readSessionCookie()).toBeNull();
  });

  it('returns null when there is no session cookie', () => {
    expect(readSessionCookie()).toBeNull();
  });

  it.each([
    ['a value that is not JSON', 'not-json'],
    ['a user without an email', encodeURIComponent('{"id":"u1"}')],
    [
      'a user with an empty id',
      encodeURIComponent('{"id":"","email":"ada@example.com"}'),
    ],
    ['JSON null', 'null'],
  ])('rejects %s', (_, value) => {
    document.cookie = `realplay_session=${value}; Path=/`;

    expect(readSessionCookie()).toBeNull();
  });
});
