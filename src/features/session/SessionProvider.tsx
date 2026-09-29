import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import {
  deleteSessionCookie,
  readSessionCookie,
  SessionContext,
  writeSessionCookie,
  type RegisteredUser,
} from './session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Lazy initial state: restored synchronously, before any route guard renders.
  const [user, setUser] = useState(readSessionCookie);

  function startSession(nextUser: RegisteredUser, token: string) {
    setUser(nextUser);
    return writeSessionCookie(token);
  }

  function endSession() {
    deleteSessionCookie();
    setUser(null);
    // App-owned request cache, including the registration mutation and its submitted values.
    queryClient.clear();
  }

  return (
    <SessionContext.Provider value={{ user, startSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
}
