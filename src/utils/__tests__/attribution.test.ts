import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureAttribution,
  clearAttribution,
  snapshotRegistrationAttribution,
} from '../attribution';

const DAY_MS = 24 * 60 * 60 * 1000;
const LANDED_AT = new Date('2026-01-01T00:00:00.000Z');

describe('attribution', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(LANDED_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('captures utm_*, ref, gclid and fbclid, keeping the first value of each and skipping empty or untracked params', () => {
    captureAttribution(
      '?utm_source=google&promo=A&ref=&gclid=g1&fbclid=f1&utm_source=bing&ref=friend',
    );

    expect(snapshotRegistrationAttribution().attribution).toEqual({
      params: {
        utm_source: 'google',
        gclid: 'g1',
        fbclid: 'f1',
        ref: 'friend',
      },
      capturedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('stores nothing when the link has no tracked params', () => {
    captureAttribution('?promo=A&welcome=1');

    expect(snapshotRegistrationAttribution().attribution).toBeNull();
  });

  it('keeps the first touch until 30 days have passed, then expires it and accepts a new one', () => {
    captureAttribution('?utm_source=first');

    vi.setSystemTime(LANDED_AT.getTime() + 30 * DAY_MS - 1);
    captureAttribution('?utm_source=second');
    expect(snapshotRegistrationAttribution().attribution?.params).toEqual({
      utm_source: 'first',
    });

    vi.setSystemTime(LANDED_AT.getTime() + 30 * DAY_MS);
    expect(snapshotRegistrationAttribution().attribution).toBeNull();

    captureAttribution('?utm_source=third');
    expect(snapshotRegistrationAttribution().attribution).toEqual({
      params: { utm_source: 'third' },
      capturedAt: '2026-01-31T00:00:00.000Z',
    });
  });

  it.each([
    ['invalid JSON', encodeURIComponent('{not json')],
    [
      'untracked params',
      encodeURIComponent(
        '{"params":{"promo":"A"},"capturedAt":"2026-01-01T00:00:00.000Z"}',
      ),
    ],
    [
      'a bad date',
      encodeURIComponent('{"params":{"ref":"x"},"capturedAt":"yesterday"}'),
    ],
    [
      'a future date',
      encodeURIComponent(
        '{"params":{"ref":"x"},"capturedAt":"2026-02-01T00:00:00.000Z"}',
      ),
    ],
    ['an undecodable value', '%E0%A4%A'],
  ])(
    'ignores a stored record with %s and replaces it on the next capture',
    (_, stored) => {
      document.cookie = `realplay_attribution=${stored}; Path=/`;

      expect(snapshotRegistrationAttribution().attribution).toBeNull();

      captureAttribution('?ref=friend');
      expect(snapshotRegistrationAttribution().attribution?.params).toEqual({
        ref: 'friend',
      });
    },
  );

  it('gives the visitor a stable UUID that survives clearing the attribution', () => {
    captureAttribution('?utm_source=google');
    const { anonymousVisitorId } = snapshotRegistrationAttribution();

    clearAttribution();

    expect(anonymousVisitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(snapshotRegistrationAttribution()).toEqual({
      anonymousVisitorId,
      attribution: null,
    });
  });
});
