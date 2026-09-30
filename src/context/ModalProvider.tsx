import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Modal, ModalType } from '../types';
import { MODAL_QUERY_KEYS, readModals } from '../utils/modals';
import { ModalContext } from './ModalContext';

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  function openModal(modal: Modal) {
    setModals((current) => [
      ...current.filter(({ type }) => type !== modal.type),
      modal,
    ]);
  }

  function removeTriggerFromUrlInSameRender(type: ModalType) {
    if (!readModals(search).some((modal) => modal.type === type)) return;
    const params = new URLSearchParams(search);
    params.delete(MODAL_QUERY_KEYS[type]);
    void navigate(
      { pathname, search: params.toString(), hash },
      { replace: true, flushSync: true },
    );
  }

  function closeModal(type: ModalType) {
    setModals((current) => current.filter((modal) => modal.type !== type));
    removeTriggerFromUrlInSameRender(type);
  }

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}
