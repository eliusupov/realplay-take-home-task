import type { Attribution } from '../types';

const ATTRIBUTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const ATTRIBUTION_KEY = 'realplay_attribution';
const ANONYMOUS_VISITOR_ID_KEY = 'realplay_anonymous_visitor_id';
const STORAGE_PROBE_KEY = 'realplay_storage_probe';
const TRACKED_KEYS = new Set(['ref', 'gclid', 'fbclid']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const valuesLostOnReload = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => valuesLostOnReload.get(key) ?? null,
  setItem: (key: string, value: string) => {
    valuesLostOnReload.set(key, value);
  },
  removeItem: (key: string) => {
    valuesLostOnReload.delete(key);
  },
};

function openLocalStorageOrMemoryWhenBlocked() {
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, '1');
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return localStorage;
  } catch {
    return memoryStorage;
  }
}

const storage = openLocalStorageOrMemoryWhenBlocked();

export const isAttributionPersistent = storage !== memoryStorage;

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

function readFreshAttribution(): Attribution | null {
  const stored = storage.getItem(ATTRIBUTION_KEY);
  if (!stored) return null;
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!isAttribution(value)) return null;
  const ageMs = Date.now() - Date.parse(value.capturedAt);
  return ageMs >= 0 && ageMs < ATTRIBUTION_DURATION_MS ? value : null;
}

function ensureAnonymousVisitorId() {
  const stored = storage.getItem(ANONYMOUS_VISITOR_ID_KEY);
  if (isAnonymousVisitorId(stored)) return stored;
  const anonymousVisitorId = crypto.randomUUID();
  storage.setItem(ANONYMOUS_VISITOR_ID_KEY, anonymousVisitorId);
  return anonymousVisitorId;
}

export function captureAttribution(search: string) {
  ensureAnonymousVisitorId();
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
  storage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
}

export function snapshotRegistrationAttribution() {
  return {
    anonymousVisitorId: ensureAnonymousVisitorId(),
    attribution: readFreshAttribution(),
  };
}

export function clearAttribution() {
  storage.removeItem(ATTRIBUTION_KEY);
}
