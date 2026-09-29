import type { AlertColor } from '@mui/material/Alert';
import { createContext, useContext } from 'react';

export interface Toast {
  severity: AlertColor;
  message: string;
}

// Provided by the app shell, which renders the toast at the root so it
// survives the page that showed it unmounting.
export const ToastContext = createContext<((toast: Toast) => void) | null>(
  null,
);

export function useShowToast() {
  const showToast = useContext(ToastContext);
  if (!showToast)
    throw new Error('useShowToast must be used inside ToastContext');
  return showToast;
}
