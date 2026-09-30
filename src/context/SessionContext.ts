import { createContext } from 'react';
import type { RegisteredUser } from '../types';

interface SessionContextValue {
  user: RegisteredUser | null;
  startSession: (user: RegisteredUser, token: string) => boolean;
  endSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
