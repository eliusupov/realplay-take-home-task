import { createContext, useContext } from 'react';

export interface RegisteredUser {
  id: string;
  email: string;
}

export interface SessionContextValue {
  user: RegisteredUser | null;
  /** Returns false when the cookie could not be written (the session then lasts until reload). */
  startSession: (user: RegisteredUser, token: string) => boolean;
  endSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

const SESSION_COOKIE = 'realplay_session';

// Browser-session cookie (no Max-Age): no expiry timers, gone when the browser session ends.
// Written by JavaScript, so it cannot be HttpOnly; a real backend would set that.
function cookieAttributes() {
  return `Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

function readSessionToken() {
  return document.cookie
    .split('; ')
    .find((pair) => pair.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}

export function writeSessionCookie(token: string) {
  document.cookie = `${SESSION_COOKIE}=${token}; ${cookieAttributes()}`;
  return readSessionToken() === token;
}

export function deleteSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; ${cookieAttributes()}`;
}

// Demo-only decoding of the unsigned mock token; the cookie is untrusted input.
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
