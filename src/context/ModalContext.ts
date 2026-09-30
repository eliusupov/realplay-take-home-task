import { createContext } from 'react';
import type { Modal, ModalType } from '../types';

interface ModalContextValue {
  modals: Modal[];
  openModal: (modal: Modal) => void;
  closeModal: (type: ModalType) => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);
