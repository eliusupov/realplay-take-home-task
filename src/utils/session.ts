import type { RegisteredUser } from '../types';
import { deleteCookie, readCookie, writeCookie } from './cookies';

const SESSION_COOKIE = 'realplay_session';

export function writeSessionCookie(token: string) {
  return writeCookie(SESSION_COOKIE, token);
}

export function deleteSessionCookie() {
  deleteCookie(SESSION_COOKIE);
}

export function readSessionCookie(): RegisteredUser | null {
  const token = readCookie(SESSION_COOKIE);
  const payload = token?.split('.')[1];
  if (!token || token.split('.').length !== 3 || !payload) return null;
  try {
    const bytes = Uint8Array.from(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      (char) => char.charCodeAt(0),
    );
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof claims !== 'object' || claims === null) return null;
    const { sub, email } = claims as Record<string, unknown>;
    if (typeof sub !== 'string' || !sub || typeof email !== 'string' || !email)
      return null;
    return { id: sub, email };
  } catch {
    return null;
  }
}
