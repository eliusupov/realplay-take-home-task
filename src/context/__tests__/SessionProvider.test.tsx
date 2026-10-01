import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useSession } from '../../hooks/useSession';
import { renderWithProviders } from '../../test/renderWithProviders';

function SessionStatus() {
  const { user, endSession } = useSession();
  return (
    <>
      <output>{user?.email ?? 'Signed out'}</output>
      <button onClick={endSession}>Sign out</button>
    </>
  );
}

const sessionRoutes = <Route path="/" element={<SessionStatus />} />;

describe('SessionProvider', () => {
  it('restores the user from a valid session cookie', () => {
    renderWithProviders({
      routes: sessionRoutes,
      signedInAs: { id: 'u1', email: 'ada@example.com' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('ada@example.com');
  });

  it('endSession signs the user out and clears the cookie', async () => {
    const { user } = renderWithProviders({
      routes: sessionRoutes,
      signedInAs: { id: 'u1', email: 'ada@example.com' },
    });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('status')).toHaveTextContent('Signed out');
    expect(document.cookie).not.toContain('realplay_session');
  });
});
