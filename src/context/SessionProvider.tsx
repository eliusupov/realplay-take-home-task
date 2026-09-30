import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { RegisteredUser } from '../types';
import {
  deleteSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from '../utils/session';
import { SessionContext } from './SessionContext';

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(readSessionCookie);

  function startSession(nextUser: RegisteredUser, token: string) {
    setUser(nextUser);
    return writeSessionCookie(token);
  }

  function endSession() {
    deleteSessionCookie();
    setUser(null);
    queryClient.clear();
  }

  return (
    <SessionContext.Provider value={{ user, startSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
}
