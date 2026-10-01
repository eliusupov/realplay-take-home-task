const SECOND_MS = 1000;

const cookieAttributes = `Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;

export function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split('; ')
    .find((pair) => pair.startsWith(prefix))
    ?.slice(prefix.length);
}

export function writeCookie(name: string, value: string, lifetimeMs?: number) {
  const maxAge =
    lifetimeMs === undefined
      ? ''
      : `Max-Age=${String(Math.ceil(lifetimeMs / SECOND_MS))}; `;
  document.cookie = `${name}=${value}; ${maxAge}${cookieAttributes}`;
}

export function deleteCookie(name: string) {
  writeCookie(name, '', 0);
}
