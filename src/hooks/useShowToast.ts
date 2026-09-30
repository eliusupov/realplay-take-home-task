import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export function useShowToast() {
  const showToast = useContext(ToastContext);
  if (!showToast)
    throw new Error('useShowToast must be used inside ToastContext');
  return showToast;
}
