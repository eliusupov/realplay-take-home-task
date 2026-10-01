import type { ReturnLocation } from '../types';

const RETURN_LOCATION_KEY = 'realplay_return_location';

export function toReturnLocation(value: unknown): ReturnLocation | null {
  if (typeof value !== 'object' || value === null) return null;
  const { pathname, search, hash } = value as Record<string, unknown>;
  const isAppPath =
    typeof pathname === 'string' &&
    pathname.startsWith('/') &&
    !pathname.startsWith('//');
  return isAppPath && typeof search === 'string' && typeof hash === 'string'
    ? { pathname, search, hash }
    : null;
}

export function rememberReturnLocation(location: ReturnLocation) {
  try {
    sessionStorage.setItem(RETURN_LOCATION_KEY, JSON.stringify(location));
    return true;
  } catch {
    return false;
  }
}

export function readRememberedReturnLocation() {
  try {
    const stored = sessionStorage.getItem(RETURN_LOCATION_KEY);
    return stored ? toReturnLocation(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function forgetReturnLocation() {
  try {
    sessionStorage.removeItem(RETURN_LOCATION_KEY);
    return true;
  } catch {
    return false;
  }
}
