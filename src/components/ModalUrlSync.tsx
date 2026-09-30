import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useModals } from '../hooks/useModals';
import { MODAL_TYPES, readModals } from '../utils/modals';

export function ModalUrlSync() {
  const { search } = useLocation();
  const { openModal, closeModal } = useModals();

  useEffect(() => {
    const triggers = readModals(search);
    for (const type of MODAL_TYPES) {
      if (!triggers.some((modal) => modal.type === type)) closeModal(type);
    }
    for (const modal of triggers) openModal(modal);
  }, [search, openModal, closeModal]);

  return null;
}
