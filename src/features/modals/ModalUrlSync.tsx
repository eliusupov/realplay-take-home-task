import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MODAL_TYPES, readModals, useModals } from './modals';

// The only caller of openModal: on every location change (cold load, refresh,
// back/forward, in-app navigation) the entries follow the URL, one way.
export function ModalUrlSync() {
  const { search } = useLocation();
  const { openModal, closeModal } = useModals();

  useEffect(() => {
    const triggers = readModals(search);
    // A type without a trigger has no key to remove, so this never writes the URL.
    for (const type of MODAL_TYPES) {
      if (!triggers.some((modal) => modal.type === type)) closeModal(type);
    }
    for (const modal of triggers) openModal(modal);
  }, [search, openModal, closeModal]);

  return null;
}
