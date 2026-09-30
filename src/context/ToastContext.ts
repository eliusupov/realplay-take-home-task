import type { AlertColor } from '@mui/material/Alert';
import { createContext } from 'react';

export interface Toast {
  severity: AlertColor;
  message: string;
}

export const ToastContext = createContext<((toast: Toast) => void) | null>(
  null,
);
