import { createContext, useContext } from 'react';

// The four URL modals. Values come from the URL: untrusted, rendered as text only.
export type Modal =
  | { type: 'welcome' }
  | { type: 'promo'; params: { code: string } }
  | { type: 'invite'; params: { friendId: string } }
  | { type: 'registration' };

export type ModalType = Modal['type'];

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

/**
 * The modals a query string asks for, in link order. Keys are case-sensitive;
 * a repeated key counts once, at its first occurrence and with its first value.
 */
export function readModals(search: string): Modal[] {
  const params = new URLSearchParams(search);
  const modals: Modal[] = [];
  for (const key of new Set(params.keys())) {
    const modal = toModal(key, params.get(key) ?? '');
    if (modal) modals.push(modal);
  }
  return modals;
}

export interface ModalContextValue {
  /** Open entries in link order; only the first is shown. */
  modals: Modal[];
  openModal: (modal: Modal) => void;
  closeModal: (type: ModalType) => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

export function useModals() {
  const value = useContext(ModalContext);
  if (!value) throw new Error('useModals must be used inside ModalProvider');
  return value;
}
