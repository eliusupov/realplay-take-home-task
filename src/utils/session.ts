import type { RegisteredUser } from '../types';

const SESSION_COOKIE = 'realplay_session';

function browserSessionCookieAttributes() {
  return `Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

function readSessionToken() {
  return document.cookie
    .split('; ')
    .find((pair) => pair.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}

export function writeSessionCookie(token: string) {
  document.cookie = `${SESSION_COOKIE}=${token}; ${browserSessionCookieAttributes()}`;
  const isCookieSaved = readSessionToken() === token;
  return isCookieSaved;
}

export function deleteSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; ${browserSessionCookieAttributes()}`;
}

export function readSessionCookie(): RegisteredUser | null {
  const token = readSessionToken();
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
