import { describe, expect, it } from 'vitest';
import { readModals } from '../modals';

describe('readModals', () => {
  it('returns modals in the order their params appear in the link', () => {
    expect(
      readModals('?invite=f7&utm_source=x&signup=1&promo=SPRING&welcome=1'),
    ).toEqual([
      { type: 'invite', params: { friendId: 'f7' } },
      { type: 'registration' },
      { type: 'promo', params: { code: 'SPRING' } },
      { type: 'welcome' },
    ]);
  });

  it('uses the first occurrence of a repeated param', () => {
    expect(readModals('?promo=A&welcome=1&promo=B')).toEqual([
      { type: 'promo', params: { code: 'A' } },
      { type: 'welcome' },
    ]);
  });

  it('ignores invalid values', () => {
    expect(readModals('?welcome=true&signup=0&promo=&invite=')).toEqual([]);
  });
});
