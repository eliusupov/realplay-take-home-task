import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Modal, ModalType } from '../types';
import { MODAL_QUERY_KEYS, readModals } from '../utils/modals';
import { ModalContext } from './ModalContext';

function toQueryValue(modal: Modal) {
  switch (modal.type) {
    case 'promo':
      return modal.params.code;
    case 'invite':
      return modal.params.friendId;
    default:
      return '1';
  }
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const modals = readModals(search);

  function openModal(modal: Modal) {
    const params = new URLSearchParams(search);
    params.set(MODAL_QUERY_KEYS[modal.type], toQueryValue(modal));
    const isAlreadyOpen =
      params.toString() === new URLSearchParams(search).toString();
    if (isAlreadyOpen) return;
    void navigate({ pathname, search: params.toString(), hash });
  }

  function closeModal(type: ModalType) {
    const params = new URLSearchParams(search);
    params.delete(MODAL_QUERY_KEYS[type]);
    void navigate(
      { pathname, search: params.toString(), hash },
      { replace: true },
    );
  }

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}
