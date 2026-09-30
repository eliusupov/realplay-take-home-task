import { useContext } from 'react';
import { ModalContext } from '../context/ModalContext';

export function useModals() {
  const value = useContext(ModalContext);
  if (!value) throw new Error('useModals must be used inside ModalProvider');
  return value;
}
