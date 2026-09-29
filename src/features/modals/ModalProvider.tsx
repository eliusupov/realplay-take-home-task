import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MODAL_QUERY_KEYS,
  ModalContext,
  readModals,
  type Modal,
  type ModalType,
} from './modals';

// The modal stack. Not persisted: ModalUrlSync rebuilds it from the URL.
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  // Idempotent per type: an open entry is replaced and moved to the end, so
  // opening every URL trigger in link order leaves the entries in link order.
  function openModal(modal: Modal) {
    setModals((current) => [
      ...current.filter(({ type }) => type !== modal.type),
      modal,
    ]);
  }

  // Also removes the trigger from the URL (every occurrence of its key, nothing
  // else). A key with an ignored value, like welcome=2, stays.
  function closeModal(type: ModalType) {
    setModals((current) => current.filter((modal) => modal.type !== type));
    if (!readModals(search).some((modal) => modal.type === type)) return;
    const params = new URLSearchParams(search);
    params.delete(MODAL_QUERY_KEYS[type]);
    // flushSync: the entry and its trigger disappear in the same render.
    void navigate(
      { pathname, search: params.toString(), hash },
      { replace: true, flushSync: true },
    );
  }

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}
