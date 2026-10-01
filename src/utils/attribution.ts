import type { Attribution } from '../types';
import { deleteCookie, readCookie, writeCookie } from './cookies';

const DAY_MS = 24 * 60 * 60 * 1000;
const ATTRIBUTION_DURATION_MS = 30 * DAY_MS;
const ANONYMOUS_VISITOR_ID_LIFETIME_MS = 400 * DAY_MS;

const ATTRIBUTION_COOKIE = 'realplay_attribution';
const ANONYMOUS_VISITOR_ID_COOKIE = 'realplay_anonymous_visitor_id';
const COOKIE_PROBE = 'realplay_cookie_probe';
const TRACKED_KEYS = new Set(['ref', 'gclid', 'fbclid']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const valuesLostOnReload = new Map<string, string>();
let isCapturePausedUntilReload = false;

function canSaveCookies() {
  const isCookieSaved = writeCookie(COOKIE_PROBE, '1');
  deleteCookie(COOKIE_PROBE);
  return isCookieSaved;
}

export const isAttributionPersistent = canSaveCookies();

function readValue(name: string) {
  return valuesLostOnReload.get(name) ?? readCookie(name);
}

function writeValue(name: string, value: string, lifetimeMs: number) {
  if (writeCookie(name, value, lifetimeMs)) valuesLostOnReload.delete(name);
  else valuesLostOnReload.set(name, value);
}

function isTrackedKey(key: string) {
  return key.startsWith('utm_') || TRACKED_KEYS.has(key);
}

export function isAnonymousVisitorId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isAttribution(value: unknown): value is Attribution {
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

function attributionAgeMs(attribution: Attribution) {
  return Date.now() - Date.parse(attribution.capturedAt);
}

function readFreshAttribution(): Attribution | null {
  const stored = readValue(ATTRIBUTION_COOKIE);
  if (!stored) return null;
  let value: unknown;
  try {
    value = JSON.parse(decodeURIComponent(stored));
  } catch {
    return null;
  }
  if (!isAttribution(value)) return null;
  const ageMs = attributionAgeMs(value);
  return ageMs >= 0 && ageMs < ATTRIBUTION_DURATION_MS ? value : null;
}

function saveAttribution(attribution: Attribution) {
  writeValue(
    ATTRIBUTION_COOKIE,
    encodeURIComponent(JSON.stringify(attribution)),
    ATTRIBUTION_DURATION_MS - attributionAgeMs(attribution),
  );
}

function renewAnonymousVisitorId() {
  const stored = readValue(ANONYMOUS_VISITOR_ID_COOKIE);
  const anonymousVisitorId = isAnonymousVisitorId(stored)
    ? stored
    : crypto.randomUUID();
  writeValue(
    ANONYMOUS_VISITOR_ID_COOKIE,
    anonymousVisitorId,
    ANONYMOUS_VISITOR_ID_LIFETIME_MS,
  );
  return anonymousVisitorId;
}

export function pauseCaptureUntilReload() {
  isCapturePausedUntilReload = true;
}

export function captureAttribution(search: string) {
  if (isCapturePausedUntilReload) return;
  renewAnonymousVisitorId();
  const freshAttribution = readFreshAttribution();
  if (freshAttribution) {
    saveAttribution(freshAttribution);
    return;
  }
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (value && isTrackedKey(key) && !Object.hasOwn(params, key))
      params[key] = value;
  }
  if (Object.keys(params).length === 0) return;
  saveAttribution({ params, capturedAt: new Date().toISOString() });
}

export function snapshotRegistrationAttribution() {
  return {
    anonymousVisitorId: renewAnonymousVisitorId(),
    attribution: readFreshAttribution(),
  };
}

export function clearAttribution() {
  deleteCookie(ATTRIBUTION_COOKIE);
  valuesLostOnReload.delete(ATTRIBUTION_COOKIE);
}
