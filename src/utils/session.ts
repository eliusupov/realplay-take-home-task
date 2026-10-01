import type { RegisteredUser } from '../types';
import { deleteCookie, readCookie, writeCookie } from './cookies';

const SESSION_COOKIE = 'realplay_session';

export function writeSessionCookie(user: RegisteredUser) {
  writeCookie(SESSION_COOKIE, encodeURIComponent(JSON.stringify(user)));
}

export function deleteSessionCookie() {
  deleteCookie(SESSION_COOKIE);
}

export function readSessionCookie(): RegisteredUser | null {
  const stored = readCookie(SESSION_COOKIE);
  if (!stored) return null;
  try {
    const { id, email } = JSON.parse(decodeURIComponent(stored)) as Record<
      string,
      unknown
    >;
    return typeof id === 'string' && id && typeof email === 'string' && email
      ? { id, email }
      : null;
  } catch {
    return null;
  }
}
