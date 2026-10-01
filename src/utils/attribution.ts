import type { Attribution } from '../types';
import { deleteCookie, readCookie, writeCookie } from './cookies';

const ATTRIBUTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const ATTRIBUTION_COOKIE = 'realplay_attribution';
const TRACKED_KEYS = new Set(['ref', 'gclid', 'fbclid']);

let isCapturePausedUntilReload = false;

function isTrackedKey(key: string) {
  return key.startsWith('utm_') || TRACKED_KEYS.has(key);
}

function isAttribution(value: unknown): value is Attribution {
  if (typeof value !== 'object' || value === null) return false;
  const { params, capturedAt } = value as Record<string, unknown>;
  if (typeof capturedAt !== 'string' || Number.isNaN(Date.parse(capturedAt)))
    return false;
  if (typeof params !== 'object' || params === null || Array.isArray(params))
    return false;
  const entries = Object.entries(params as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, paramValue]) =>
        isTrackedKey(key) &&
        typeof paramValue === 'string' &&
        paramValue !== '',
    )
  );
}

export function readFreshAttribution(): Attribution | null {
  const stored = readCookie(ATTRIBUTION_COOKIE);
  if (!stored) return null;
  let value: unknown;
  try {
    value = JSON.parse(decodeURIComponent(stored));
  } catch {
    return null;
  }
  if (!isAttribution(value)) return null;
  const ageMs = Date.now() - Date.parse(value.capturedAt);
  return ageMs >= 0 && ageMs < ATTRIBUTION_DURATION_MS ? value : null;
}

export function pauseCaptureUntilReload() {
  isCapturePausedUntilReload = true;
}

export function captureAttribution(search: string) {
  if (isCapturePausedUntilReload) return;
  if (readFreshAttribution()) return;
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (value && isTrackedKey(key) && !Object.hasOwn(params, key))
      params[key] = value;
  }
  if (Object.keys(params).length === 0) return;
  const attribution: Attribution = {
    params,
    capturedAt: new Date().toISOString(),
  };
  writeCookie(
    ATTRIBUTION_COOKIE,
    encodeURIComponent(JSON.stringify(attribution)),
    ATTRIBUTION_DURATION_MS,
  );
}

export function clearAttribution() {
  deleteCookie(ATTRIBUTION_COOKIE);
}
