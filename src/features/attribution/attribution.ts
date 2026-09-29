// First-touch campaign attribution and the anonymous visitor id. The capture,
// expiry, snapshot and cleanup rules live here; the rest of the app uses only
// the exports below.

export interface Attribution {
  params: Record<string, string>;
  /** ISO 8601 time of the tagged visit that started the window. */
  capturedAt: string;
}

const ATTRIBUTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const ATTRIBUTION_KEY = 'realplay_attribution';
const ANONYMOUS_VISITOR_ID_KEY = 'realplay_anonymous_visitor_id';
const STORAGE_PROBE_KEY = 'realplay_storage_probe';
const TRACKED_KEYS = new Set(['ref', 'gclid', 'fbclid']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Blocked site storage throws on access or write. Then the values live in this
// page's memory instead, and are lost on reload.
const memory = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
};

function openStorage() {
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, '1');
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return localStorage;
  } catch {
    return memoryStorage;
  }
}

// Probed once per page. A quota error after a passing probe is not handled
// (these records are a few hundred bytes). A failing probe on readable but full
// storage also switches to memory, so values stored earlier are not read.
const storage = openStorage();

export const isAttributionPersistent = storage !== memoryStorage;

function isTrackedKey(key: string) {
  return key.startsWith('utm_') || TRACKED_KEYS.has(key);
}

export function isAnonymousVisitorId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

// Stored and submitted records are untrusted until they pass this check.
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

// A missing, corrupt, future-dated or expired (age >= 30 days) record counts
// as absent.
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

// Created once per browser profile and never cleared by this app.
function ensureAnonymousVisitorId() {
  const stored = storage.getItem(ANONYMOUS_VISITOR_ID_KEY);
  if (isAnonymousVisitorId(stored)) return stored;
  const anonymousVisitorId = crypto.randomUUID();
  storage.setItem(ANONYMOUS_VISITOR_ID_KEY, anonymousVisitorId);
  return anonymousVisitorId;
}

/**
 * Applies the first-touch rule to a visit's query string. Call it only while
 * unauthenticated, before any redirect drops the query. A fresh record is
 * never changed; without one, a visit with tracked parameters starts a new
 * record and a visit without them stores nothing.
 */
export function captureAttribution(search: string) {
  ensureAnonymousVisitorId(); // The journey identity starts on the first visit.
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

/** Snapshot for one registration request. */
export function snapshotRegistrationAttribution() {
  return {
    anonymousVisitorId: ensureAnonymousVisitorId(),
    attribution: readFreshAttribution(),
  };
}

/** After a successful registration. The anonymous visitor id stays. */
export function clearAttribution() {
  storage.removeItem(ATTRIBUTION_KEY);
}
