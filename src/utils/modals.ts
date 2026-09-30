import type { Modal, ModalType } from '../types';

export const MODAL_QUERY_KEYS = {
  welcome: 'welcome',
  promo: 'promo',
  invite: 'invite',
  registration: 'signup',
} as const satisfies Record<ModalType, string>;

export const MODAL_TYPES: ModalType[] = [
  'welcome',
  'promo',
  'invite',
  'registration',
];

function toModal(key: string, value: string): Modal | null {
  switch (key) {
    case MODAL_QUERY_KEYS.welcome:
      return value === '1' ? { type: 'welcome' } : null;
    case MODAL_QUERY_KEYS.promo:
      return value ? { type: 'promo', params: { code: value } } : null;
    case MODAL_QUERY_KEYS.invite:
      return value ? { type: 'invite', params: { friendId: value } } : null;
    case MODAL_QUERY_KEYS.registration:
      return value === '1' ? { type: 'registration' } : null;
    default:
      return null;
  }
}

export function readModals(search: string): Modal[] {
  const params = new URLSearchParams(search);
  const modals: Modal[] = [];
  const uniqueKeysInLinkOrder = new Set(params.keys());
  for (const key of uniqueKeysInLinkOrder) {
    const modal = toModal(key, params.get(key) ?? '');
    if (modal) modals.push(modal);
  }
  return modals;
}
